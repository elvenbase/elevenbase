-- 📋 QUERY PULITA: Formazioni salvate nelle sessioni di allenamento (decodificate)

SELECT 
    ts.title AS sessione,
    ts.session_date AS data_sessione,
    ts.start_time AS ora_inizio,
    tl.formation AS formazione_codice,
    -- Decodifica tipo formazione: predefinita o custom
    CASE 
        WHEN tl.formation IN ('4-4-2', '4-3-3', '3-5-2') THEN tl.formation
        WHEN cf.name IS NOT NULL THEN cf.name || ' (Custom)'
        ELSE tl.formation || ' (Sconosciuta)'
    END AS tipo_formazione_leggibile,
    -- Conta giocatori posizionati 
    (
        SELECT COUNT(*)
        FROM jsonb_each_text(tl.players_data->'positions') 
        WHERE value != 'none' AND value IS NOT NULL
    ) AS giocatori_posizionati,
    tl.players_data->'positions' AS posizioni_giocatori,
    tl.players_data->'formation_data' AS impostazioni_png,
    tl.created_at AS creata_il,
    tl.updated_at AS aggiornata_il
FROM training_lineups tl
JOIN training_sessions ts ON ts.id = tl.session_id
LEFT JOIN custom_formations cf ON cf.id = tl.formation::uuid
ORDER BY tl.updated_at DESC;