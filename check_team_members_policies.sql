-- Verifica RLS policies su team_members

-- Lista policies su team_members
SELECT 
    'TEAM_MEMBERS POLICIES' as check_type,
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members'
ORDER BY policyname;

-- Verifica se l'utente può leggere i propri dati
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "87aeb5b2-9396-4a94-bfef-0537602fe85e"}';

-- Test query che fallisce nel frontend
SELECT 
    'FRONTEND QUERY TEST' as test_type,
    tm.*,
    t.name as team_name,
    t.owner_id
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
WHERE tm.user_id = '87aeb5b2-9396-4a94-bfef-0537602fe85e'::UUID;

RESET ROLE;