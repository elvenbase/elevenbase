-- Riabilita RLS con policies MINIME - test se questo risolve il problema
SET search_path = '';

-- ===================================
-- RIABILITA RLS SU TABELLE PRINCIPALI
-- ===================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- ===================================
-- POLICIES SUPER PERMISSIVE (per test)
-- ===================================

-- TEAMS: Permetti tutto agli utenti autenticati (temporaneo)
CREATE POLICY "teams_all_access_temp" ON public.teams
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- TEAM_MEMBERS: Permetti tutto agli utenti autenticati (temporaneo)  
CREATE POLICY "team_members_all_access_temp" ON public.team_members
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- TEAM_INVITES: Permetti tutto agli utenti autenticati (temporaneo)
CREATE POLICY "team_invites_all_access_temp" ON public.team_invites
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ===================================
-- MANTIENI ALTRE TABELLE SENZA RLS (per ora)
-- ===================================

-- Queste rimangono senza RLS per evitare problemi
-- ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trialists DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.training_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.training_attendance DISABLE ROW LEVEL SECURITY;

SELECT 'RLS RIABILITATO CON POLICIES PERMISSIVE' as status;

-- Test di accesso
SELECT 
    'TEST TEAMS CON RLS PERMISSIVO' as test,
    COUNT(*) as count
FROM public.teams;

SELECT 
    'TEST TEAM_MEMBERS CON RLS PERMISSIVO' as test,
    COUNT(*) as count
FROM public.team_members;

SELECT 'POLICIES PERMISSIVE ATTIVE - DOVREBBE FUNZIONARE' as final_status;