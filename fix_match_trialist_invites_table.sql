-- Script per risolvere il problema della colonna self_registered mancante
-- nella tabella match_trialist_invites

-- Esegui questo script nel SQL Editor del Dashboard Supabase:
-- https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw/sql

-- 1. Prima, crea la tabella se non esiste
CREATE TABLE IF NOT EXISTS public.match_trialist_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  trialist_id uuid NOT NULL REFERENCES public.trialists(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(match_id, trialist_id)
);

-- 2. Aggiungi la colonna self_registered se non esiste
ALTER TABLE public.match_trialist_invites 
ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT false;

-- 3. Aggiungi commento per documentazione
COMMENT ON COLUMN public.match_trialist_invites.self_registered IS 'Indica se il trialist si è registrato autonomamente tramite il link pubblico';

-- 4. Abilita RLS se non già abilitato
ALTER TABLE public.match_trialist_invites ENABLE ROW LEVEL SECURITY;

-- 5. Crea le politiche RLS per match_trialist_invites
DROP POLICY IF EXISTS "Coaches and admins can manage trialist invites" ON public.match_trialist_invites;
CREATE POLICY "Coaches and admins can manage trialist invites" 
ON public.match_trialist_invites 
FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

DROP POLICY IF EXISTS "Trialists can view their own invites" ON public.match_trialist_invites;
CREATE POLICY "Trialists can view their own invites" 
ON public.match_trialist_invites 
FOR SELECT 
USING (auth.uid() = trialist_id);

-- 6. Crea indici per migliori performance
CREATE INDEX IF NOT EXISTS idx_match_trialist_invites_match_trialist ON public.match_trialist_invites(match_id, trialist_id);
CREATE INDEX IF NOT EXISTS idx_match_trialist_invites_status ON public.match_trialist_invites(status);

-- 7. Aggiungi trigger per updated_at se non esiste
CREATE OR REPLACE FUNCTION public.update_match_trialist_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_trialist_invites_updated_at ON public.match_trialist_invites;
CREATE TRIGGER update_match_trialist_invites_updated_at
BEFORE UPDATE ON public.match_trialist_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_match_trialist_invites_updated_at();

-- 8. Verifica che tutto sia stato creato correttamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'match_trialist_invites' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verifica le politiche RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'match_trialist_invites';