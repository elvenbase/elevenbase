-- 🔍 DEBUG TEAM_INVITES RLS POLICIES
-- Esegui queste query nel SQL Editor di Supabase

-- 1. Verifica se RLS è abilitato su team_invites
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'team_invites';

-- 2. Verifica le policy RLS esistenti
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_invites'
ORDER BY policyname;

-- 3. Verifica i dati nella tabella (come admin)
SELECT 
    id,
    code,
    role,
    team_id,
    is_active,
    expires_at,
    created_at
FROM team_invites 
WHERE code = 'CDRPLAY720c0'
LIMIT 5;

-- 4. Test query come utente anonimo (simula frontend)
-- (Questa potrebbe fallire se RLS blocca)
SET ROLE anon;
SELECT 
    id,
    code,
    role,
    team_id,
    is_active,
    expires_at
FROM team_invites 
WHERE code = 'CDRPLAY720c0'
AND is_active = true
AND expires_at >= NOW();
RESET ROLE;

-- 5. Controlla i permessi sulla tabella
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'team_invites'
ORDER BY grantee, privilege_type;