-- Fix access per utenti pending in team_members

-- Lista le policies esistenti
SELECT 
    'EXISTING POLICIES' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members';

-- Crea/aggiorna policy per permettere agli utenti di leggere i propri dati anche se pending
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;

CREATE POLICY "team_members_read_own" ON public.team_members
    FOR SELECT TO authenticated
    USING (
        -- Superadmin può vedere tutto
        public.is_superadmin(auth.uid())
        OR
        -- Utente può vedere i propri dati (anche se pending)
        user_id = auth.uid()
        OR
        -- Team managers possono vedere membri del loro team
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('founder', 'admin')
            AND tm.status = 'active'
        )
    );

-- Policy per gestire team_members (approve, etc.)
DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;

CREATE POLICY "team_members_manage" ON public.team_members
    FOR ALL TO authenticated
    USING (
        -- Superadmin può gestire tutto
        public.is_superadmin(auth.uid())
        OR
        -- Team managers possono gestire membri del loro team
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('founder', 'admin')
            AND tm.status = 'active'
        )
    )
    WITH CHECK (
        -- Solo superadmin e team managers possono modificare
        public.is_superadmin(auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('founder', 'admin')
            AND tm.status = 'active'
        )
    );

SELECT 'TEAM_MEMBERS POLICIES FIXATE - PENDING ACCESS ABILITATO' as status;