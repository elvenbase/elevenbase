-- Script per verificare e correggere l'associazione dei giocatori ai team
-- Esegui questo script nel SQL Editor di Supabase

-- 1. VERIFICA: Mostra tutti i team esistenti
SELECT 
    id,
    name,
    abbreviation,
    (SELECT COUNT(*) FROM players WHERE team_id = teams.id) as player_count,
    (SELECT COUNT(*) FROM team_members WHERE team_id = teams.id) as member_count,
    created_at
FROM teams
ORDER BY created_at;

-- 2. VERIFICA: Mostra giocatori senza team_id
SELECT 
    id,
    first_name,
    last_name,
    team_id,
    created_at
FROM players
WHERE team_id IS NULL
LIMIT 20;

-- 3. VERIFICA: Mostra distribuzione giocatori per team
SELECT 
    COALESCE(t.name, 'NESSUN TEAM') as team_name,
    COUNT(p.id) as player_count
FROM players p
LEFT JOIN teams t ON p.team_id = t.id
GROUP BY t.name
ORDER BY player_count DESC;

-- 4. FIX: Associa tutti i giocatori senza team al team Ca De Rissi
DO $$
DECLARE
    v_cdr_team_id uuid;
    v_players_updated integer;
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
    
    -- Aggiorna i giocatori senza team
    UPDATE players
    SET team_id = v_cdr_team_id
    WHERE team_id IS NULL;
    
    GET DIAGNOSTICS v_players_updated = ROW_COUNT;
    
    RAISE NOTICE 'Aggiornati % giocatori senza team -> Ca De Rissi SG', v_players_updated;
    
    -- Mostra il risultato
    RAISE NOTICE '';
    RAISE NOTICE 'RISULTATO FINALE:';
    PERFORM (
        SELECT COUNT(*) 
        FROM players 
        WHERE team_id = v_cdr_team_id
    );
    RAISE NOTICE 'Giocatori Ca De Rissi SG: %', (SELECT COUNT(*) FROM players WHERE team_id = v_cdr_team_id);
    RAISE NOTICE 'Giocatori totali con team: %', (SELECT COUNT(*) FROM players WHERE team_id IS NOT NULL);
    RAISE NOTICE 'Giocatori senza team: %', (SELECT COUNT(*) FROM players WHERE team_id IS NULL);
END $$;

-- 5. VERIFICA FINALE: Mostra stato dopo il fix
SELECT 
    'DOPO IL FIX' as status,
    (SELECT COUNT(*) FROM players WHERE team_id IS NOT NULL) as players_with_team,
    (SELECT COUNT(*) FROM players WHERE team_id IS NULL) as players_without_team,
    (SELECT COUNT(*) FROM players WHERE team_id = (SELECT id FROM teams WHERE name = 'Ca De Rissi SG')) as cdr_players;