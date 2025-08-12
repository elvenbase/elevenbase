import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, username, firstName, lastName, phone }: CreateUserRequest = await req.json();

    console.log('Creating user:', { email, username });

    // Create user in auth system
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User will need to be manually activated
      user_metadata: {
        username,
        first_name: firstName,
        last_name: lastName,
        phone
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('User created successfully:', authData.user?.id);

    // Update the profile with the real user ID and set status to inactive
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          phone,
          status: 'inactive'
        })
        .eq('username', username);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'Utente creato con successo. Attivalo per permettere il login.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);