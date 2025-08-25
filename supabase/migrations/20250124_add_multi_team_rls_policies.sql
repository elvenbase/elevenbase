-- Script per aggiungere RLS policies multi-team a training_sessions, matches e tabelle correlate
-- Esegui questo script nel SQL Editor di Supabase

-- ============================================
-- STEP 1: RIMUOVI LE VECCHIE POLICIES
-- ============================================

-- Training sessions
DROP POLICY IF EXISTS "Everyone can view training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Coaches and admins can manage training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can read training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Authenticated users can create training sessions" ON public.training_sessions;

-- Matches
DROP POLICY IF EXISTS "Everyone can view matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;

-- Training attendance
DROP POLICY IF EXISTS "Users can view training attendance" ON public.training_attendance;
DROP POLICY IF EXISTS "Coaches can manage training attendance" ON public.training_attendance;

-- ============================================
-- STEP 2: NUOVE RLS POLICIES MULTI-TEAM
-- ============================================

-- TRAINING SESSIONS POLICIES
-- Team members can view training sessions of their team
CREATE POLICY "Team members can view team training sessions" 
  ON public.training_sessions FOR SELECT 
  USING (
    team_id IS NULL OR -- Legacy sessions without team (for migration)
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = training_sessions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Team coaches and admins can create training sessions
CREATE POLICY "Team coaches can create training sessions" 
  ON public.training_sessions FOR INSERT 
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = training_sessions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- Team coaches and admins can update training sessions of their team
CREATE POLICY "Team coaches can update team training sessions" 
  ON public.training_sessions FOR UPDATE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = training_sessions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- Team coaches and admins can delete training sessions of their team
CREATE POLICY "Team coaches can delete team training sessions" 
  ON public.training_sessions FOR DELETE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = training_sessions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- MATCHES POLICIES
-- Team members can view matches of their team
CREATE POLICY "Team members can view team matches" 
  ON public.matches FOR SELECT 
  USING (
    team_id IS NULL OR -- Legacy matches without team (for migration)
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = matches.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Team admins can create matches
CREATE POLICY "Team admins can create matches" 
  ON public.matches FOR INSERT 
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = matches.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role = 'admin'
    )
  );

-- Team admins can update matches of their team
CREATE POLICY "Team admins can update team matches" 
  ON public.matches FOR UPDATE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = matches.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role = 'admin'
    )
  );

-- Team admins can delete matches of their team
CREATE POLICY "Team admins can delete team matches" 
  ON public.matches FOR DELETE 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = matches.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role = 'admin'
    )
  );

-- TRAINING ATTENDANCE POLICIES
-- Team members can view attendance for their team's training sessions
CREATE POLICY "Team members can view team training attendance" 
  ON public.training_attendance FOR SELECT 
  USING (
    EXISTS(
      SELECT 1 FROM public.training_sessions ts
      JOIN public.team_members tm ON tm.team_id = ts.team_id
      WHERE ts.id = training_attendance.session_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Team coaches and admins can manage attendance
CREATE POLICY "Team coaches can manage training attendance" 
  ON public.training_attendance FOR ALL 
  USING (
    EXISTS(
      SELECT 1 FROM public.training_sessions ts
      JOIN public.team_members tm ON tm.team_id = ts.team_id
      WHERE ts.id = training_attendance.session_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'coach')
    )
  );

-- ============================================
-- STEP 3: COMPETITIONS POLICIES (se necessario)
-- ============================================

-- Team members can view competitions of their team
CREATE POLICY "Team members can view team competitions" 
  ON public.competitions FOR SELECT 
  USING (
    team_id IS NULL OR -- Legacy competitions without team
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = competitions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
  );

-- Team admins can manage competitions
CREATE POLICY "Team admins can manage team competitions" 
  ON public.competitions FOR ALL 
  USING (
    team_id IS NOT NULL AND
    EXISTS(
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = competitions.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
      AND tm.role = 'admin'
    )
  );

-- ============================================
-- STEP 4: PLAYER-SPECIFIC POLICIES 
-- ============================================

-- Players policies (già esistenti nel multi-team migration)
-- Verifichiamo che esistano
DO $$
BEGIN
  -- Se non esistono, le creiamo
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'players' AND policyname = 'Team members can view team players') THEN
    EXECUTE 'CREATE POLICY "Team members can view team players" ON public.players FOR SELECT USING (
      team_id IS NULL OR
      EXISTS(
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = players.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.status = ''active''
      )
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'players' AND policyname = 'Team coaches can manage team players') THEN
    EXECUTE 'CREATE POLICY "Team coaches can manage team players" ON public.players FOR ALL USING (
      team_id IS NOT NULL AND
      EXISTS(
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = players.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.status = ''active''
        AND tm.role IN (''admin'', ''coach'')
      )
    )';
  END IF;
END $$;

-- ============================================
-- STEP 5: FEEDBACK DI VERIFICA
-- ============================================

-- Mostra tutte le policies create
SELECT 
  schemaname, tablename, policyname, cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ'
    WHEN cmd = 'INSERT' THEN 'CREATE' 
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    WHEN cmd = 'ALL' THEN 'FULL_ACCESS'
    ELSE cmd
  END as permission_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('training_sessions', 'matches', 'training_attendance', 'competitions', 'players')
ORDER BY tablename, cmd;