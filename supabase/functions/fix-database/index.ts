import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SQL per aggiungere la colonna self_registered
    const sql = `
      ALTER TABLE public.match_trialist_invites 
      ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT false;
      
      COMMENT ON COLUMN public.match_trialist_invites.self_registered IS 'Indica se il trialist si è registrato autonomamente tramite il link pubblico';
      
      ALTER TABLE public.match_trialist_invites ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT FROM pg_policies 
              WHERE tablename = 'match_trialist_invites' 
              AND policyname = 'Coaches and admins can manage trialist invites'
          ) THEN
              CREATE POLICY "Coaches and admins can manage trialist invites" 
              ON public.match_trialist_invites 
              FOR ALL 
              USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
          END IF;
          
          IF NOT EXISTS (
              SELECT FROM pg_policies 
              WHERE tablename = 'match_trialist_invites' 
              AND policyname = 'Trialists can view their own invites'
          ) THEN
              CREATE POLICY "Trialists can view their own invites" 
              ON public.match_trialist_invites 
              FOR SELECT 
              USING (auth.uid() = trialist_id);
          END IF;
      END $$;
    `

    // Esegui SQL usando la funzione rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('Errore SQL:', error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Colonna self_registered aggiunta con successo!',
      data 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Errore:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})