-- VERIFICA TUTTI I TEAM DI UN UTENTE

-- Per a.camolese+2@gmail.com, mostra TUTTI i team a cui appartiene
SELECT 
    u.email,
    t.name as team_name,
    t.abbreviation,
    tm.role,
    tm.status,
    tm.created_at as joined_at,
    t.owner_id = u.id as is_owner,
    t.created_at as team_created
FROM auth.users u
JOIN public.team_members tm ON tm.user_id = u.id
JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'a.camolese+2@gmail.com'
ORDER BY tm.created_at ASC;

-- Verifica se ci sono team duplicati o team creati dall'utente
SELECT 
    t.name,
    t.abbreviation,
    t.owner_id,
    u.email as owner_email,
    t.created_at
FROM public.teams t
LEFT JOIN auth.users u ON u.id = t.owner_id
WHERE u.email LIKE 'a.camolese%@gmail.com'
   OR t.name LIKE '%Test%'
ORDER BY t.created_at DESC;

-- Conta quanti team ha ogni utente test
SELECT 
    u.email,
    COUNT(DISTINCT tm.team_id) as num_teams,
    STRING_AGG(t.name, ', ' ORDER BY tm.created_at) as teams
FROM auth.users u
LEFT JOIN public.team_members tm ON tm.user_id = u.id
LEFT JOIN public.teams t ON t.id = tm.team_id
WHERE u.email LIKE '%camolese%@gmail.com'
GROUP BY u.email
ORDER BY u.email;