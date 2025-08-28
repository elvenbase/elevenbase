-- Genera un nuovo codice invito admin per test
-- Usa il team del founder coach@elevenbase.pro

-- Prima trova il team_id del coach
SELECT 
    'TEAM INFO' as check_type,
    t.id as team_id,
    t.name as team_name,
    tm.user_id as founder_id
FROM public.teams t
JOIN public.team_members tm ON tm.team_id = t.id
JOIN auth.users u ON u.id = tm.user_id
WHERE u.email = 'coach@elevenbase.pro'
AND tm.role = 'founder';

-- Genera nuovo codice invito admin
-- SOSTITUISCI IL TEAM_ID CON QUELLO TROVATO SOPRA
SELECT public.generate_team_invite(
    'aa14c760-9c07-4e7b-96bb-76723098d8b9'::UUID,  -- team_id del coach
    'admin',                                        -- ruolo admin
    5,                                             -- max_uses = 5 (più tentativi)
    7                                              -- expires_days = 7
) as new_invite_result;