-- 🚀 QUERY SEMPLICE: Test rapido formazioni (ultime 5)

SELECT 
    ts.title AS sessione,
    -- Decodifica formazione
    CASE 
        WHEN tl.formation IN ('4-4-2', '4-3-3', '3-5-2') THEN tl.formation
        WHEN cf.name IS NOT NULL THEN cf.name
        ELSE 'ID: ' || tl.formation
    END AS formazione,
    -- Conta giocatori
    (SELECT COUNT(*) FROM jsonb_each_text(tl.players_data->'positions') 
     WHERE value != 'none' AND value IS NOT NULL) AS giocatori,
    tl.updated_at AS salvata_il,
    ROUND(EXTRACT(EPOCH FROM (NOW() - tl.updated_at))) AS secondi_fa
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
LEFT JOIN custom_formations cf ON cf.id = tl.formation::uuid
ORDER BY tl.updated_at DESC
LIMIT 5;