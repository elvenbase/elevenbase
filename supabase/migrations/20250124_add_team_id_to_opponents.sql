-- Migration per aggiungere team_id alla tabella opponents
-- Esegui questo script nel SQL Editor di Supabase

-- ============================================
-- STEP 1: AGGIUNGI team_id A OPPONENTS
-- ============================================

-- Aggiungi colonna team_id (nullable per compatibilità)
ALTER TABLE public.opponents 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_opponents_team ON public.opponents(team_id);

-- ============================================
-- STEP 2: ABILITA RLS SU OPPONENTS
-- ============================================

-- Abilita Row Level Security su opponents se non è già abilitata
ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREA RLS POLICIES PER OPPONENTS
-- ============================================

-- Rimuovi eventuali policies esistenti
DROP POLICY IF EXISTS "Everyone can view opponents" ON public.opponents;
DROP POLICY IF EXISTS "Authenticated users can create opponents" ON public.opponents;

-- Team members possono vedere gli avversari del loro team
CREATE POLICY "Team members can view team opponents" 
  ON public.opponents FOR SELECT 
  USING (
    team_id IS NULL OR -- Legacy opponents without team (for migration)
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = opponents.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Team coaches e admins possono creare avversari
CREATE POLICY "Team coaches can create opponents" 
  ON public.opponents FOR INSERT 
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = opponents.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- Team coaches e admins possono aggiornare avversari del loro team
CREATE POLICY "Team coaches can update team opponents" 
  ON public.opponents FOR UPDATE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = opponents.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- Team coaches e admins possono eliminare avversari del loro team
CREATE POLICY "Team coaches can delete team opponents" 
  ON public.opponents FOR DELETE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = opponents.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- ============================================
-- STEP 4: MIGRA DATI ESISTENTI
-- ============================================

DO $$
DECLARE
    v_cdr_team_id uuid;
    v_opponents_updated integer;
BEGIN
    -- Trova il team Ca De Rissi
    SELECT id INTO v_cdr_team_id
    FROM teams
    WHERE name = 'Ca De Rissi SG'
    LIMIT 1;
    
    IF v_cdr_team_id IS NULL THEN
        RAISE NOTICE 'Team Ca De Rissi SG non trovato!';
        RETURN;
    END IF;
    
    -- Aggiorna gli avversari senza team
    UPDATE opponents
    SET team_id = v_cdr_team_id
    WHERE team_id IS NULL;
    
    GET DIAGNOSTICS v_opponents_updated = ROW_COUNT;
    
    RAISE NOTICE 'Aggiornati % avversari -> Ca De Rissi SG', v_opponents_updated;
END $$;

-- ============================================
-- STEP 5: VERIFICA FINALE
-- ============================================

-- Mostra distribuzione avversari per team
SELECT 
    COALESCE(t.name, 'NESSUN TEAM') as team_name,
    COUNT(o.id) as opponents_count
FROM opponents o
LEFT JOIN teams t ON o.team_id = t.id
GROUP BY t.name
ORDER BY opponents_count DESC;

-- Mostra le policies create
SELECT 
  schemaname, tablename, policyname, cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ'
    WHEN cmd = 'INSERT' THEN 'CREATE' 
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    WHEN cmd = 'ALL' THEN 'FULL_ACCESS'
    ELSE cmd
  END as permission_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'opponents'
ORDER BY cmd;