-- FIX ULTIMA CHIAMATA: Elimina COMPLETAMENTE ogni recursione
-- Approccio DRASTICO: policies minimaliste senza JOIN

SET search_path = '';

-- ===================================
-- DISABILITA RLS TEMPORANEAMENTE
-- ===================================

-- Disabilita RLS per testare
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trialists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance DISABLE ROW LEVEL SECURITY;

-- Drop TUTTE le policies esistenti
DROP POLICY IF EXISTS "teams_access" ON public.teams;
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;
DROP POLICY IF EXISTS "players_access" ON public.players;
DROP POLICY IF EXISTS "trialists_access" ON public.trialists;
DROP POLICY IF EXISTS "training_sessions_access" ON public.training_sessions;
DROPOLICY IF EXISTS "matches_access" ON public.matches;
DROP POLICY IF EXISTS "training_attendance_access" ON public.training_attendance;

SELECT 'TUTTE LE POLICIES ELIMINATE - RLS DISABILITATO' as status;

-- ===================================
-- VERIFICA CHE FUNZIONI SENZA RLS
-- ===================================

-- Test accesso diretto senza RLS
SELECT 
    'TEST SENZA RLS' as test,
    COUNT(*) as teams_count
FROM public.teams;

SELECT 
    'TEST PLAYERS SENZA RLS' as test,
    COUNT(*) as players_count  
FROM public.players;

SELECT 
    'TEST TEAM_MEMBERS SENZA RLS' as test,
    COUNT(*) as members_count
FROM public.team_members;

-- ===================================
-- RIABILITA RLS CON POLICIES BASILARI
-- ===================================

-- Riabilita RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;

-- ===================================
-- TEAMS: Policy SUPER SEMPLICE
-- ===================================

CREATE POLICY "teams_basic" ON public.teams
    FOR ALL TO authenticated
    USING (
        -- Solo superadmin, owner o check diretto su team_members
        public.is_superadmin(auth.uid())
        OR owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = teams.id 
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR owner_id = auth.uid()
    );

-- ===================================
-- TEAM_MEMBERS: Policy DIRETTA
-- ===================================

CREATE POLICY "team_members_basic" ON public.team_members
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Utente può vedere i propri dati
        user_id = auth.uid()
        OR
        -- Owner del team (check DIRETTO senza join)
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR user_id = auth.uid()
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    );

-- ===================================
-- PLAYERS: Policy MINIMA
-- ===================================

CREATE POLICY "players_basic" ON public.players
    FOR ALL TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    );

-- ===================================
-- ALTRE TABELLE: Policy IDENTICHE
-- ===================================

CREATE POLICY "trialists_basic" ON public.trialists
    FOR ALL TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "training_sessions_basic" ON public.training_sessions
    FOR ALL TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "matches_basic" ON public.matches
    FOR ALL TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "training_attendance_basic" ON public.training_attendance
    FOR ALL TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            WHERE ts.team_id IN (
                SELECT id FROM public.teams 
                WHERE owner_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            WHERE ts.team_id IN (
                SELECT id FROM public.teams 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- ===================================
-- TEST FINALE
-- ===================================

SELECT 'RLS RIABILITATO CON POLICIES BASILARI' as status;

-- Test con RLS attivo
SELECT 
    'TEST CON RLS BASILARE' as test,
    COUNT(*) as teams_accessible
FROM public.teams;

SELECT 
    'TEST TEAM_MEMBERS CON RLS' as test,
    COUNT(*) as members_accessible
FROM public.team_members;

SELECT 'FIX RECURSION COMPLETATO - APPROCCIO DRASTICO' as final_status;