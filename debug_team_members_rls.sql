-- Debug RLS policies su team_members e join con teams

-- Lista tutte le RLS policies sulla tabella team_members
SELECT 
    'TEAM_MEMBERS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members'
ORDER BY policyname;

-- Verifica se RLS è abilitato su team_members
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'teams');

-- Test di una query semplice su team_members per l'utente
-- SOSTITUISCI CON L'UUID DELL'UTENTE CHE STA TESTANDO
SELECT 
    'TEAM_MEMBERS TEST' as check_type,
    tm.id,
    tm.user_id,
    tm.team_id,
    tm.role,
    tm.status
FROM public.team_members tm
WHERE tm.user_id = '87aeb5b2-9396-4a94-bfef-0537602fe85e'::UUID;