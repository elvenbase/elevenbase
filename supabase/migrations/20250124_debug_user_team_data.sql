-- Script di DEBUG per verificare cosa dovrebbe vedere un utente specifico
-- SOSTITUISCI 'TUA_EMAIL@EXAMPLE.COM' con la tua email reale

-- 1. Trova l'utente e il suo team
WITH user_info AS (
    SELECT 
        u.id as user_id,
        u.email,
        tm.team_id,
        tm.role,
        tm.status,
        t.name as team_name,
        t.abbreviation,
        t.owner_id,
        (u.id = t.owner_id) as is_owner
    FROM auth.users u
    LEFT JOIN team_members tm ON tm.user_id = u.id
    LEFT JOIN teams t ON t.id = tm.team_id
    WHERE u.email = 'TUA_EMAIL@EXAMPLE.COM'  -- 🔴 SOSTITUISCI CON LA TUA EMAIL
)
SELECT * FROM user_info;

-- 2. Mostra i giocatori che questo utente dovrebbe vedere
WITH user_team AS (
    SELECT tm.team_id
    FROM auth.users u
    JOIN team_members tm ON tm.user_id = u.id
    WHERE u.email = 'TUA_EMAIL@EXAMPLE.COM'  -- 🔴 SOSTITUISCI CON LA TUA EMAIL
)
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.team_id,
    t.name as team_name
FROM players p
LEFT JOIN teams t ON t.id = p.team_id
WHERE p.team_id = (SELECT team_id FROM user_team)
ORDER BY p.last_name, p.first_name;

-- 3. Confronta con i giocatori del Ca De Rissi
SELECT 
    'Giocatori nel tuo team' as category,
    COUNT(*) as count
FROM players
WHERE team_id = (
    SELECT tm.team_id
    FROM auth.users u
    JOIN team_members tm ON tm.user_id = u.id
    WHERE u.email = 'TUA_EMAIL@EXAMPLE.COM'  -- 🔴 SOSTITUISCI CON LA TUA EMAIL
)
UNION ALL
SELECT 
    'Giocatori Ca De Rissi SG' as category,
    COUNT(*) as count
FROM players
WHERE team_id = (SELECT id FROM teams WHERE name = 'Ca De Rissi SG')
UNION ALL
SELECT 
    'Giocatori totali nel DB' as category,
    COUNT(*) as count
FROM players;