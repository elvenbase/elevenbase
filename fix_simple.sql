-- Script semplice per risolvere il problema della colonna self_registered
-- Esegui questo nel SQL Editor del Dashboard Supabase

-- 1. Verifica se la tabella esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'match_trialist_invites') THEN
        -- Crea la tabella se non esiste
        CREATE TABLE public.match_trialist_invites (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
            trialist_id uuid NOT NULL REFERENCES public.trialists(id) ON DELETE CASCADE,
            status text NOT NULL DEFAULT 'pending',
            notes text,
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            updated_at timestamp with time zone NOT NULL DEFAULT now(),
            UNIQUE(match_id, trialist_id)
        );
        
        RAISE NOTICE 'Tabella match_trialist_invites creata';
    ELSE
        RAISE NOTICE 'Tabella match_trialist_invites già esiste';
    END IF;
END $$;

-- 2. Aggiungi la colonna self_registered se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'match_trialist_invites' 
        AND column_name = 'self_registered'
    ) THEN
        ALTER TABLE public.match_trialist_invites 
        ADD COLUMN self_registered BOOLEAN NOT NULL DEFAULT false;
        
        RAISE NOTICE 'Colonna self_registered aggiunta';
    ELSE
        RAISE NOTICE 'Colonna self_registered già esiste';
    END IF;
END $$;

-- 3. Abilita RLS
ALTER TABLE public.match_trialist_invites ENABLE ROW LEVEL SECURITY;

-- 4. Crea politiche RLS semplici
DO $$
BEGIN
    -- Rimuovi politiche esistenti se esistono
    DROP POLICY IF EXISTS "Coaches and admins can manage trialist invites" ON public.match_trialist_invites;
    DROP POLICY IF EXISTS "Trialists can view their own invites" ON public.match_trialist_invites;
    
    -- Crea nuove politiche
    CREATE POLICY "Coaches and admins can manage trialist invites" 
    ON public.match_trialist_invites 
    FOR ALL 
    USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

    CREATE POLICY "Trialists can view their own invites" 
    ON public.match_trialist_invites 
    FOR SELECT 
    USING (auth.uid() = trialist_id);
    
    RAISE NOTICE 'Politiche RLS create';
END $$;

-- 5. Verifica finale
SELECT 
    'Tabella creata/modificata con successo!' as risultato,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'match_trialist_invites' 
AND table_schema = 'public'
ORDER BY ordinal_position;