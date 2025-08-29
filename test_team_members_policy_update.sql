-- TEST: Aggiornamento policy team_members_read_own come richiesto
-- Data: $(date)

-- Verifica policy esistente
SELECT 
    'POLICY BEFORE UPDATE' as check_type,
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members'
AND policyname = 'team_members_read_own';

-- Aggiorna la policy come richiesto
DROP POLICY IF EXISTS "team_members_read_own" ON public.team_members;

CREATE POLICY "team_members_read_own" ON public.team_members
    FOR SELECT TO authenticated
    USING (
        public.is_superadmin(auth.uid()) OR user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role IN ('founder', 'admin') AND tm.status = 'active')
    );

-- Verifica policy aggiornata
SELECT 
    'POLICY AFTER UPDATE' as check_type,
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members'
AND policyname = 'team_members_read_own';

-- Test di funzionamento con un utente di test
-- (Simuliamo un utente pending per verificare che può leggere i suoi dati)
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "87aeb5b2-9396-4a94-bfef-0537602fe85e"}';

-- Test query: l'utente dovrebbe poter vedere i suoi dati anche se pending
SELECT 
    'QUERY TEST RESULT' as test_type,
    COUNT(*) as readable_records
FROM public.team_members 
WHERE user_id = '87aeb5b2-9396-4a94-bfef-0537602fe85e'::UUID;

RESET ROLE;

SELECT 'TEAM_MEMBERS_READ_OWN POLICY AGGIORNATA CON SUCCESSO' as final_status;