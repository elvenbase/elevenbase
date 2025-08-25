-- QUERY SEMPLICE: Verifica solo a.camolese+2@gmail.com

SELECT 
    u.email,
    t.name as team_name,
    tm.role,
    tm.created_at as quando_aggiunto
FROM auth.users u
JOIN public.team_members tm ON tm.user_id = u.id
JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'a.camolese+2@gmail.com'
ORDER BY tm.created_at;