-- ELIMINA: Utente a.camolese@gmail.com definitivamente da Supabase
-- Cerca in tutte le tabelle e elimina completamente

-- 1. Trova l'utente in auth.users
SELECT 
    'UTENTE TROVATO' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email LIKE '%camolese%' OR email LIKE '%a.camolese@gmail.com%';

-- 2. Trova nelle identities
SELECT 
    'IDENTITY TROVATA' as check_type,
    i.id,
    i.user_id,
    i.provider,
    u.email
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email LIKE '%camolese%';

-- 3. Trova in profiles
SELECT 
    'PROFILO TROVATO' as check_type,
    p.id,
    p.username,
    u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email LIKE '%camolese%';

-- 4. Trova in team_members
SELECT 
    'TEAM MEMBER TROVATO' as check_type,
    tm.id,
    tm.role,
    tm.status,
    u.email,
    t.name as team_name
FROM team_members tm
JOIN auth.users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE u.email LIKE '%camolese%';

-- 5. Trova teams di proprietà
SELECT 
    'TEAM PROPRIETARIO' as check_type,
    t.id,
    t.name,
    t.abbreviation,
    u.email as owner_email
FROM teams t
JOIN auth.users u ON u.id = t.owner_id
WHERE u.email LIKE '%camolese%';

-- 6. Trova in user_roles
SELECT 
    'USER ROLES TROVATO' as check_type,
    ur.role,
    u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email LIKE '%camolese%';