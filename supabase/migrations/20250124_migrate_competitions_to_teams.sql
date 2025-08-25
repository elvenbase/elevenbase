-- Migration per assegnare team_id alle competitions esistenti
-- Esegui questo script nel SQL Editor di Supabase DOPO aver eseguito lo script opponents

-- ============================================
-- STEP 1: MIGRA COMPETITIONS ESISTENTI
-- ============================================

DO $$
DECLARE
    v_cdr_team_id uuid;
    v_competitions_updated integer;
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
    
    -- Aggiorna le competitions senza team
    UPDATE competitions
    SET team_id = v_cdr_team_id
    WHERE team_id IS NULL;
    
    GET DIAGNOSTICS v_competitions_updated = ROW_COUNT;
    
    RAISE NOTICE 'Aggiornati % competitions -> Ca De Rissi SG', v_competitions_updated;
END $$;

-- ============================================
-- STEP 2: VERIFICA FINALE
-- ============================================

-- Mostra distribuzione competitions per team
SELECT 
    COALESCE(t.name, 'NESSUN TEAM') as team_name,
    COUNT(c.id) as competitions_count,
    STRING_AGG(c.name, ', ') as competition_names
FROM competitions c
LEFT JOIN teams t ON c.team_id = t.id
GROUP BY t.name
ORDER BY competitions_count DESC;

-- Mostra le policies per competitions
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
AND tablename = 'competitions'
ORDER BY cmd;