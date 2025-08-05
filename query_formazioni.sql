-- 📋 QUERY PULITA: Formazioni salvate nelle sessioni di allenamento

SELECT 
    ts.title AS sessione,
    ts.session_date AS data_sessione,
    ts.start_time AS ora_inizio,
    tl.formation AS tipo_formazione,
    tl.players_data->'positions' AS posizioni_giocatori,
    tl.players_data->'formation_data' AS impostazioni_png,
    tl.created_at AS creata_il,
    tl.updated_at AS aggiornata_il
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
ORDER BY tl.updated_at DESC;