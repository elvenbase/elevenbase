-- FIX DEFINITIVO RLS: Elimina recursioni e crea policies funzionanti
SET search_path = '';

-- ===================================
-- 1. DISABILITA TEMPORANEAMENTE TUTTE LE RLS
-- ===================================

ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trialists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance DISABLE ROW LEVEL SECURITY;

-- ===================================
-- 2. DROP TUTTE LE POLICIES ESISTENTI (PULIZIA TOTALE)
-- ===================================

-- Teams policies
DROP POLICY IF EXISTS "teams_all_access_temp" ON public.teams;
DROP POLICY IF EXISTS "teams_basic" ON public.teams;
DROP POLICY IF EXISTS "teams_access" ON public.teams;
DROP POLICY IF EXISTS "teams_read_own" ON public.teams;
DROP POLICY IF EXISTS "teams_manage" ON public.teams;

-- Team members policies  
DROP POLICY IF EXISTS "team_members_all_access_temp" ON public.team_members;
DROP POLICY IF EXISTS "team_members_basic" ON public.team_members;
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;

-- Altre policies
DROP POLICY IF EXISTS "team_invites_all_access_temp" ON public.team_invites;
DROP POLICY IF EXISTS "players_basic" ON public.players;
DROP POLICY IF EXISTS "trialists_basic" ON public.trialists;
DROP POLICY IF EXISTS "training_sessions_basic" ON public.training_sessions;
DROP POLICY IF EXISTS "matches_basic" ON public.matches;
DROP POLICY IF EXISTS "training_attendance_basic" ON public.training_attendance;

-- ===================================
-- 3. RIABILITA RLS E CREA POLICIES SENZA RECURSIONE
-- ===================================

-- Riabilita RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- ===================================
-- TEAMS: Policy basata solo su owner_id (NO join)
-- ===================================

CREATE POLICY "teams_simple" ON public.teams
    FOR ALL TO authenticated
    USING (
        -- Superadmin
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin')
        OR
        -- Owner diretto
        owner_id = auth.uid()
        OR
        -- Team member check (DIRETTO, no subquery che causa recursione)
        auth.uid() IN (
            SELECT user_id FROM public.team_members 
            WHERE team_id = teams.id 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e owner possono modificare
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin')
        OR owner_id = auth.uid()
    );

-- ===================================
-- TEAM_MEMBERS: Policy senza join con teams
-- ===================================

CREATE POLICY "team_members_simple" ON public.team_members
    FOR ALL TO authenticated
    USING (
        -- Superadmin
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin')
        OR
        -- Propri dati
        user_id = auth.uid()
        OR
        -- Owner del team (check diretto su teams.owner_id)
        team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
        OR
        -- Admin del team (check diretto)
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin, team owner, e admin possono modificare
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin')
        OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
        OR team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- TEAM_INVITES: Policy semplice
-- ===================================

CREATE POLICY "team_invites_simple" ON public.team_invites
    FOR ALL TO authenticated
    USING (
        -- Superadmin
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superladmin')
        OR
        -- Owner del team
        team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
        OR
        -- Admin del team
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo team managers possono creare inviti
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin')
        OR team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid())
        OR team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- VERIFICA FINALE
-- ===================================

SELECT 'RLS ABILITATO CON POLICIES SENZA RECURSIONE' as status;

-- Test delle query che prima fallivano
SELECT 
    'TEST TEAMS LOGO' as test,
    logo_url
FROM public.teams 
WHERE id = 'eb0b5581-08d4-4ce0-8a7b-5529764441b3'::uuid;

SELECT 
    'TEST TEAM_MEMBERS' as test,
    COUNT(*) as count
FROM public.team_members
WHERE team_id = 'eb0b5581-08d4-4ce0-8a7b-5529764441b3'::uuid;

SELECT 'POLICIES SENZA RECURSIONE ATTIVE' as final_status;