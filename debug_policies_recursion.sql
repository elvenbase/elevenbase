-- Debug completo: trova TUTTE le policies che causano recursione
SET search_path = '';

-- ===================================
-- LISTA TUTTE LE POLICIES ESISTENTI
-- ===================================

SELECT 
    'POLICIES TEAMS' as table_name,
    pol.polname as policy_name,
    pol.polcmd as command,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' AND cls.relname = 'teams';

SELECT 
    'POLICIES TEAM_MEMBERS' as table_name,
    pol.polname as policy_name,
    pol.polcmd as command,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' AND cls.relname = 'team_members';

-- ===================================
-- DROP TUTTE LE POLICIES ESISTENTI (COMPRESE QUELLE NASCOSTE)
-- ===================================

-- Drop policies teams
DROP POLICY IF EXISTS "teams_all_access_temp" ON public.teams;
DROP POLICY IF EXISTS "teams_basic" ON public.teams;
DROP POLICY IF EXISTS "teams_access" ON public.teams;
DROP POLICY IF EXISTS "teams_read_own" ON public.teams;
DROP POLICY IF EXISTS "teams_manage" ON public.teams;
DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_delete" ON public.teams;

-- Drop policies team_members
DROP POLICY IF EXISTS "team_members_all_access_temp" ON public.team_members;
DROP POLICY IF EXISTS "team_members_basic" ON public.team_members;
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

-- ===================================
-- DISABILITA COMPLETAMENTE RLS (ANCORA)
-- ===================================

ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites DISABLE ROW LEVEL SECURITY;

-- ===================================
-- TEST ACCESSO DIRETTO SENZA RLS
-- ===================================

SELECT 'RLS COMPLETAMENTE DISABILITATO DI NUOVO' as status;

-- Test query semplice come quella che fallisce
SELECT 
    'TEST QUERY LOGO' as test,
    logo_url
FROM public.teams 
WHERE id = 'eb0b5581-08d4-4ce0-8a7b-5529764441b3'::uuid;

SELECT 
    'TEST QUERY TEAMS COUNT' as test,
    COUNT(*) as count
FROM public.teams;

SELECT 'DOVREBBE FUNZIONARE SENZA ERRORI 500' as final_status;