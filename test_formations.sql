-- 🔍 QUERY 1: Tutte le formazioni salvate (panoramica)
SELECT 
  tl.id as lineup_id,
  ts.title as session_title,
  tl.formation,
  tl.created_at,
  tl.updated_at,
  CASE 
    WHEN tl.players_data IS NOT NULL THEN 'SI'
    ELSE 'NO'
  END as has_players_data
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
ORDER BY tl.updated_at DESC;

-- 🔍 QUERY 2: Dettaglio ultima formazione salvata
SELECT 
  ts.title as session_title,
  tl.formation,
  tl.players_data->'positions' as positions,
  tl.players_data->'formation_data' as formation_settings,
  tl.updated_at
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
ORDER BY tl.updated_at DESC
LIMIT 1;

-- 🔍 QUERY 3: Conta giocatori per formazione
SELECT 
  ts.title,
  tl.formation,
  jsonb_object_keys(tl.players_data->'positions') as position_id,
  tl.players_data->'positions'->>jsonb_object_keys(tl.players_data->'positions') as player_id
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
WHERE tl.players_data->'positions'->>jsonb_object_keys(tl.players_data->'positions') != 'none'
  AND tl.players_data->'positions'->>jsonb_object_keys(tl.players_data->'positions') IS NOT NULL
ORDER BY tl.updated_at DESC;

-- 🔍 QUERY 4: Formazioni per sessione specifica (SOSTITUISCI SESSION_ID)
SELECT 
  tl.formation,
  tl.players_data,
  tl.updated_at,
  EXTRACT(EPOCH FROM (NOW() - tl.updated_at)) as seconds_ago
FROM training_lineups tl
WHERE tl.session_id = 'INSERISCI_SESSION_ID_QUI'
ORDER BY tl.updated_at DESC;

-- 🔍 QUERY 5: TEST RAPIDO - Ultima attività
SELECT 
  'ULTIMO SALVATAGGIO' as test,
  tl.formation,
  EXTRACT(EPOCH FROM (NOW() - tl.updated_at)) as seconds_ago,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - tl.updated_at)) < 60 THEN '🟢 RECENTE'
    WHEN EXTRACT(EPOCH FROM (NOW() - tl.updated_at)) < 300 THEN '🟡 VECCHIO'
    ELSE '🔴 MOLTO VECCHIO'
  END as status
FROM training_lineups tl
ORDER BY tl.updated_at DESC
LIMIT 1;
