-- Verifica associazione utente-team per andrea.camolese@gmail.com
-- Esegui questo in Supabase SQL Editor

-- 1. Trova l'utente
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    u.email_confirmed_at
FROM auth.users u
WHERE u.email = 'andrea.camolese@gmail.com';

-- 2. Verifica le associazioni team
SELECT 
    tm.id as membership_id,
    tm.team_id,
    t.name as team_name,
    t.abbreviation,
    tm.role,
    tm.status,
    tm.created_at as member_since,
    t.owner_id,
    (t.owner_id = u.id) as is_owner
FROM auth.users u
LEFT JOIN public.team_members tm ON tm.user_id = u.id
LEFT JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'andrea.camolese@gmail.com';

-- 3. Verifica tutti i team esistenti
SELECT 
    id,
    name,
    abbreviation,
    owner_id,
    created_at,
    metadata
FROM public.teams
ORDER BY created_at DESC;