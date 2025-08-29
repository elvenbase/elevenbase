-- DISABILITA COMPLETAMENTE RLS - APPROCCIO NUCLEARE
-- Temporaneo per sbloccare il sistema

SET search_path = '';

-- ===================================
-- DISABILITA RLS SU TUTTE LE TABELLE
-- ===================================

ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trialists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites DISABLE ROW LEVEL SECURITY;

-- Drop TUTTE le policies esistenti per sicurezza
DROP POLICY IF EXISTS "teams_basic" ON public.teams;
DROP POLICY IF EXISTS "team_members_basic" ON public.team_members;
DROP POLICY IF EXISTS "players_basic" ON public.players;
DROP POLICY IF EXISTS "trialists_basic" ON public.trialists;
DROP POLICY IF EXISTS "training_sessions_basic" ON public.training_sessions;
DROP POLICY IF EXISTS "matches_basic" ON public.matches;
DROP POLICY IF EXISTS "training_attendance_basic" ON public.training_attendance;

-- Drop eventuali altre policies
DROP POLICY IF EXISTS "teams_access" ON public.teams;
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;
DROP POLICY IF EXISTS "players_access" ON public.players;
DROP POLICY IF EXISTS "trialists_access" ON public.trialists;
DROP POLICY IF EXISTS "training_sessions_access" ON public.training_sessions;
DROP POLICY IF EXISTS "matches_access" ON public.matches;
DROP POLICY IF EXISTS "training_attendance_access" ON public.training_attendance;

-- ===================================
-- VERIFICA CHE TUTTO FUNZIONI
-- ===================================

SELECT 'RLS COMPLETAMENTE DISABILITATO' as status;

-- Test di accesso
SELECT 
    'TEST TEAMS' as test,
    COUNT(*) as count
FROM public.teams;

SELECT 
    'TEST PLAYERS' as test,
    COUNT(*) as count
FROM public.players;

SELECT 
    'TEST TEAM_MEMBERS' as test,
    COUNT(*) as count
FROM public.team_members;

SELECT 
    'TEST TRIALISTS' as test,
    COUNT(*) as count
FROM public.trialists;

SELECT 'TUTTI I DATI SONO ACCESSIBILI SENZA RLS' as final_status;