-- Fix delle RLS policies duplicate sulla tabella teams

-- Drop delle policies duplicate e conflittuali
DROP POLICY IF EXISTS "Allow all authenticated users to access teams" ON public.teams;
DROP POLICY IF EXISTS "teams_authenticated_access" ON public.teams;
DROP POLICY IF EXISTS "teams_read_all" ON public.teams;

-- Mantieni solo le policies essenziali e specifiche:
-- 1. Policy per inviti pubblici (già esiste e funziona)
-- 2. Policy per owner permissions (già esistono e funzionano)

-- Aggiungi una policy semplice per authenticated users (senza recursione)
CREATE POLICY "teams_authenticated_read" ON public.teams
    FOR SELECT TO authenticated
    USING (
        -- Superadmin può vedere tutto
        public.is_superadmin(auth.uid())
        OR
        -- Owner può vedere il proprio team
        auth.uid() = owner_id
        OR
        -- Team members attivi possono vedere il loro team
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

-- Policy per gestione team (update/delete)
CREATE POLICY "teams_manage" ON public.teams
    FOR ALL TO authenticated
    USING (
        -- Superadmin può gestire tutto
        public.is_superadmin(auth.uid())
        OR
        -- Owner può gestire il proprio team
        auth.uid() = owner_id
        OR
        -- Founder attivo può gestire
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id
            AND tm.user_id = auth.uid()
            AND tm.role = 'founder'
            AND tm.status = 'active'
        )
    )
    WITH CHECK (
        -- Solo owner o superadmin possono creare/modificare
        public.is_superadmin(auth.uid()) OR auth.uid() = owner_id
    );

SELECT 'TEAMS RLS POLICIES FIXATE' as status;