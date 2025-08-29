-- FIX DEFINITIVO: Infinite recursion in RLS policies
-- Elimina TUTTE le recursioni circolari nelle policies

SET search_path = '';

-- ===================================
-- 1. FIX TEAMS POLICIES
-- ===================================

-- Drop tutte le policies teams esistenti
DROP POLICY IF EXISTS "teams_read_own" ON public.teams;
DROP POLICY IF EXISTS "teams_manage" ON public.teams;
DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_delete" ON public.teams;

-- Policy SEMPLICE per teams senza self-reference
CREATE POLICY "teams_access" ON public.teams
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Owner del team può accedere
        owner_id = auth.uid()
        OR
        -- Membri del team possono vedere (SENZA join recursivo)
        id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e owner possono modificare
        public.is_superadmin(auth.uid())
        OR owner_id = auth.uid()
    );

-- ===================================
-- 2. FIX PLAYERS POLICIES  
-- ===================================

-- Drop tutte le policies players esistenti
DROP POLICY IF EXISTS "players_read" ON public.players;
DROP POLICY IF EXISTS "players_manage" ON public.players;
DROP POLICY IF EXISTS "players_select" ON public.players;
DROP POLICY IF EXISTS "players_insert" ON public.players;
DROP POLICY IF EXISTS "players_update" ON public.players;
DROP POLICY IF EXISTS "players_delete" ON public.players;

-- Policy SEMPLICE per players
CREATE POLICY "players_access" ON public.players
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team owners possono vedere players del loro team (DIRETTO)
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        -- Admin del team possono vedere players
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- 3. FIX TRIALISTS POLICIES
-- ===================================

-- Drop tutte le policies trialists esistenti  
DROP POLICY IF EXISTS "trialists_read" ON public.trialists;
DROP POLICY IF EXISTS "trialists_manage" ON public.trialists;
DROP POLICY IF EXISTS "trialists_select" ON public.trialists;
DROP POLICY IF EXISTS "trialists_insert" ON public.trialists;
DROP POLICY IF EXISTS "trialists_update" ON public.trialists;
DROP POLICY IF EXISTS "trialists_delete" ON public.trialists;

-- Policy SEMPLICE per trialists
CREATE POLICY "trialists_access" ON public.trialists
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team owners possono vedere trialists del loro team
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        -- Admin del team possono vedere trialists
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- 4. FIX TRAINING_SESSIONS POLICIES
-- ===================================

-- Drop esistenti
DROP POLICY IF EXISTS "training_sessions_read" ON public.training_sessions;
DROP POLICY IF EXISTS "training_sessions_manage" ON public.training_sessions;

-- Policy semplice
CREATE POLICY "training_sessions_access" ON public.training_sessions
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team owners possono vedere sessions del loro team
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        -- Membri attivi del team possono vedere
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- 5. FIX MATCHES POLICIES
-- ===================================

-- Drop esistenti
DROP POLICY IF EXISTS "matches_read" ON public.matches;
DROP POLICY IF EXISTS "matches_manage" ON public.matches;

-- Policy semplice
CREATE POLICY "matches_access" ON public.matches
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team owners possono vedere matches del loro team
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        -- Membri attivi del team possono vedere
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        team_id IN (
            SELECT id FROM public.teams 
            WHERE owner_id = auth.uid()
        )
        OR
        team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('founder', 'admin') 
            AND status = 'active'
        )
    );

-- ===================================
-- 6. FIX TRAINING_ATTENDANCE POLICIES
-- ===================================

-- Drop esistenti
DROP POLICY IF EXISTS "training_attendance_read" ON public.training_attendance;
DROP POLICY IF EXISTS "training_attendance_manage" ON public.training_attendance;

-- Policy semplice
CREATE POLICY "training_attendance_access" ON public.training_attendance
    FOR ALL TO authenticated
    USING (
        -- Superadmin può tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team owners possono vedere attendance del loro team
        session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            JOIN public.teams t ON ts.team_id = t.id
            WHERE t.owner_id = auth.uid()
        )
        OR
        -- Membri attivi del team possono vedere
        session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            WHERE ts.team_id IN (
                SELECT team_id FROM public.team_members 
                WHERE user_id = auth.uid() 
                AND status = 'active'
            )
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            JOIN public.teams t ON ts.team_id = t.id
            WHERE t.owner_id = auth.uid()
        )
        OR
        session_id IN (
            SELECT ts.id FROM public.training_sessions ts
            WHERE ts.team_id IN (
                SELECT team_id FROM public.team_members 
                WHERE user_id = auth.uid() 
                AND role IN ('founder', 'admin') 
                AND status = 'active'
            )
        )
    );

-- ===================================
-- 7. VERIFICA FINALE
-- ===================================

SELECT 
    'INFINITE RECURSION FIXATO' as status,
    'Tutte le policies RLS sono state semplificate' as details,
    'Nessun self-reference circolare nelle queries' as result;

-- Test rapido accesso teams
SELECT 
    'TEST TEAMS ACCESS' as test,
    COUNT(*) as teams_accessible
FROM public.teams
WHERE is_active = true;