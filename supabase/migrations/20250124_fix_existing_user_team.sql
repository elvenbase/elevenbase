-- FIX: Permetti a utenti esistenti di creare nuovi team
-- Esegui questo SOLO se vuoi permettere a andrea.camolese@gmail.com di creare un nuovo team

-- OPZIONE 1: Rimuovi l'associazione al team di default (se non è owner)
-- ATTENZIONE: Esegui solo se l'utente NON è owner del team Ca De Rissi
/*
DELETE FROM public.team_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andrea.camolese@gmail.com')
  AND team_id = (SELECT id FROM public.teams WHERE name = 'Ca De Rissi SG')
  AND team_id NOT IN (
    SELECT id FROM public.teams 
    WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'andrea.camolese@gmail.com')
  );
*/

-- OPZIONE 2: Permetti utenti in più team (modifica logica applicazione)
-- Questo richiederebbe modifiche al frontend per gestire multi-team

-- OPZIONE 3: Crea un nuovo utente con email diversa per test
-- Usa un'email come andrea.camolese+test1@gmail.com

-- Per vedere lo stato attuale:
SELECT 
    u.email,
    t.name as team_name,
    tm.role,
    tm.status,
    CASE 
        WHEN t.owner_id = u.id THEN 'OWNER'
        ELSE 'MEMBER'
    END as relationship
FROM auth.users u
JOIN public.team_members tm ON tm.user_id = u.id
JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'andrea.camolese@gmail.com';