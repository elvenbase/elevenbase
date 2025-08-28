-- Policy minima per permettere agli utenti di leggere SOLO i propri dati in team_members
-- (per verificare il proprio status)

DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;

CREATE POLICY "team_members_read_own" ON public.team_members
    FOR SELECT TO authenticated
    USING (
        -- Superadmin può vedere tutto
        public.is_superadmin(auth.uid())
        OR
        -- Utente può vedere SOLO i propri dati (per controllare status)
        user_id = auth.uid()
        OR
        -- Team managers ATTIVI possono vedere membri del loro team
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('founder', 'admin')
            AND tm.status = 'active'
        )
    );

SELECT 'POLICY MINIMA CREATA - SOLO PROPRI DATI PER VERIFICA STATUS' as status;