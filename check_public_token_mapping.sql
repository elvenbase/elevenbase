-- Verifica il mapping tra token pubblico e session ID
-- Token dal link: 1354d833317547d296c0df3fada72946
-- Session ID dal log: 805aa4fd-9dbd-4cb2-be78-d1fe07dded7a

-- 1. Trova la sessione associata al token pubblico
SELECT 
    id as session_id,
    title,
    session_date,
    start_time,
    public_link_token,
    created_at
FROM training_sessions 
WHERE public_link_token = '1354d833317547d296c0df3fada72946';

-- 2. Verifica se esistono convocati per la sessione trovata dal token
SELECT 
    ts.title,
    ts.session_date,
    ts.public_link_token,
    COUNT(tc.id) as num_convocati
FROM training_sessions ts
LEFT JOIN training_convocati tc ON ts.id = tc.session_id
WHERE ts.public_link_token = '1354d833317547d296c0df3fada72946'
GROUP BY ts.id, ts.title, ts.session_date, ts.public_link_token;

-- 3. Verifica tutti i token pubblici esistenti
SELECT 
    id,
    title,
    session_date,
    public_link_token,
    created_at
FROM training_sessions 
WHERE public_link_token IS NOT NULL
ORDER BY created_at DESC;

-- 4. Cerca convocati per tutte le sessioni recenti
SELECT 
    ts.title,
    ts.session_date,
    ts.id as session_id,
    ts.public_link_token,
    COUNT(tc.id) as num_convocati,
    STRING_AGG(p.first_name || ' ' || p.last_name, ', ') as convocati_names
FROM training_sessions ts
LEFT JOIN training_convocati tc ON ts.id = tc.session_id
LEFT JOIN players p ON tc.player_id = p.id
WHERE ts.session_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ts.id, ts.title, ts.session_date, ts.public_link_token
ORDER BY ts.session_date DESC;