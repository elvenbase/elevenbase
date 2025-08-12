-- Aggiungi colonna self_registered alla tabella match_trialist_invites
ALTER TABLE public.match_trialist_invites 
ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT false;

-- Aggiungi commento per documentazione
COMMENT ON COLUMN public.match_trialist_invites.self_registered IS 'Indica se il trialist si è registrato autonomamente tramite il link pubblico';

-- Abilita RLS se non già abilitato
ALTER TABLE public.match_trialist_invites ENABLE ROW LEVEL SECURITY;

-- Crea politiche RLS se non esistono
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