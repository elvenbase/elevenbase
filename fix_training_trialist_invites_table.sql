-- Script per risolvere il problema della colonna self_registered mancante
-- nella tabella training_trialist_invites

-- 1. Crea la tabella se non esiste (schema minimo)
CREATE TABLE IF NOT EXISTS public.training_trialist_invites (
    session_id uuid NOT NULL,
    trialist_id uuid NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (session_id, trialist_id)
);

-- 2. Aggiungi le colonne mancanti se non esistono
ALTER TABLE public.training_trialist_invites 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT false;

-- 3. Aggiungi commento per documentazione
COMMENT ON COLUMN public.training_trialist_invites.self_registered IS 'Indica se il trialist si è registrato autonomamente tramite il link pubblico';

-- 4. Abilita RLS se non già abilitato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'training_trialist_invites'
  ) THEN
    RAISE NOTICE 'Tabella training_trialist_invites non trovata';
  END IF;

  -- Abilita RLS
  ALTER TABLE public.training_trialist_invites ENABLE ROW LEVEL SECURITY;

  -- Crea policy insert se manca
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'training_trialist_invites'
      AND policyname = 'training_trialist_invites_insert'
  ) THEN
    CREATE POLICY training_trialist_invites_insert ON public.training_trialist_invites
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;

  -- Crea policy select se manca
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'training_trialist_invites'
      AND policyname = 'training_trialist_invites_select'
  ) THEN
    CREATE POLICY training_trialist_invites_select ON public.training_trialist_invites
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. Forza ricarico schema cache PostgREST/Supabase
NOTIFY pgrst, 'reload schema';