-- Controlla i convocati nel database per la sessione specifica
-- Session ID dal log: 805aa4fd-9dbd-4cb2-be78-d1fe07dded7a

-- 1. Verifica la sessione
SELECT 
    id,
    title,
    session_date,
    start_time,
    created_at
FROM training_sessions 
WHERE id = '805aa4fd-9dbd-4cb2-be78-d1fe07dded7a';

-- 2. Verifica i convocati per questa sessione
SELECT 
    tc.id,
    tc.session_id,
    tc.player_id,
    tc.confirmed,
    tc.created_at,
    p.first_name,
    p.last_name,
    p.jersey_number,
    p.status as player_status
FROM training_convocati tc
LEFT JOIN players p ON tc.player_id = p.id
WHERE tc.session_id = '805aa4fd-9dbd-4cb2-be78-d1fe07dded7a'
ORDER BY tc.created_at DESC;

-- 3. Conta i convocati
SELECT COUNT(*) as total_convocati
FROM training_convocati 
WHERE session_id = '805aa4fd-9dbd-4cb2-be78-d1fe07dded7a';

-- 4. Verifica tutte le sessioni con convocati (per confronto)
SELECT 
    ts.title,
    ts.session_date,
    ts.id as session_id,
    COUNT(tc.id) as num_convocati
FROM training_sessions ts
LEFT JOIN training_convocati tc ON ts.id = tc.session_id
GROUP BY ts.id, ts.title, ts.session_date
HAVING COUNT(tc.id) > 0
ORDER BY ts.session_date DESC;

-- 5. Verifica se ci sono problemi con la relazione players
SELECT 
    tc.*,
    CASE 
        WHEN p.id IS NULL THEN 'PLAYER_NOT_FOUND'
        WHEN p.status != 'active' THEN 'PLAYER_INACTIVE'
        ELSE 'OK'
    END as status_check
FROM training_convocati tc
LEFT JOIN players p ON tc.player_id = p.id
WHERE tc.session_id = '805aa4fd-9dbd-4cb2-be78-d1fe07dded7a';