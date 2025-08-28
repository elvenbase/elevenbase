-- Debug permessi founder per a.camolese+777@gmail.com

-- 1. Trova l'utente
SELECT 
    'USER LOOKUP' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'a.camolese+777@gmail.com';

-- 2. Verifica team membership
SELECT 
    'TEAM MEMBERSHIP' as check_type,
    tm.id,
    tm.team_id,
    tm.role,
    tm.status,
    tm.joined_at,
    t.name as team_name,
    t.owner_id,
    CASE 
        WHEN t.owner_id = tm.user_id THEN 'IS_OWNER'
        ELSE 'NOT_OWNER'
    END as ownership_status
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN auth.users u ON u.id = tm.user_id
WHERE u.email = 'a.camolese+777@gmail.com';

-- 3. Verifica status registrazione con la funzione
SELECT 
    'REGISTRATION STATUS' as check_type,
    public.get_user_registration_status(u.id) as status_result
FROM auth.users u
WHERE u.email = 'a.camolese+777@gmail.com';

-- 4. Verifica permessi di gestione team
SELECT 
    'TEAM MANAGEMENT PERMISSIONS' as check_type,
    tm.team_id,
    public.can_manage_team(tm.team_id, tm.user_id) as can_manage,
    public.is_team_founder(tm.team_id, tm.user_id) as is_founder
FROM public.team_members tm
JOIN auth.users u ON u.id = tm.user_id
WHERE u.email = 'a.camolese+777@gmail.com';

-- 5. Lista tutti i team dell'utente
SELECT 
    'ALL USER TEAMS' as check_type,
    t.id as team_id,
    t.name,
    t.owner_id,
    tm.role,
    tm.status
FROM public.teams t
JOIN public.team_members tm ON tm.team_id = t.id
JOIN auth.users u ON u.id = tm.user_id
WHERE u.email = 'a.camolese+777@gmail.com';