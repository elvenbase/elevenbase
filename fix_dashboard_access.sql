-- Fix Dashboard Data Access
-- Remove any temporary policies that might be blocking access
DROP POLICY IF EXISTS "temp_admin_access_players" ON players;
DROP POLICY IF EXISTS "temp_admin_access_training_sessions" ON training_sessions;
DROP POLICY IF EXISTS "temp_admin_access_competitions" ON competitions;
DROP POLICY IF EXISTS "temp_admin_access_trialists" ON trialists;

-- Ensure proper RLS policies for authenticated users
-- Players table policies
DO $$ 
BEGIN
  -- Allow authenticated users to read players
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'players' 
      AND policyname = 'Authenticated users can view players'
  ) THEN
    CREATE POLICY "Authenticated users can view players" ON players
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Allow users with roles to manage players
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'players' 
      AND policyname = 'Users with roles can manage players'
  ) THEN
    CREATE POLICY "Users with roles can manage players" ON players
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'admin', 'coach')
        )
      );
  END IF;
END $$;

-- Training sessions table policies
DO $$ 
BEGIN
  -- Allow authenticated users to read training sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'training_sessions' 
      AND policyname = 'Authenticated users can view training sessions'
  ) THEN
    CREATE POLICY "Authenticated users can view training sessions" ON training_sessions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Allow users with roles to manage training sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'training_sessions' 
      AND policyname = 'Users with roles can manage training sessions'
  ) THEN
    CREATE POLICY "Users with roles can manage training sessions" ON training_sessions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'admin', 'coach')
        )
      );
  END IF;
END $$;

-- Competitions table policies
DO $$ 
BEGIN
  -- Allow authenticated users to read competitions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'competitions' 
      AND policyname = 'Authenticated users can view competitions'
  ) THEN
    CREATE POLICY "Authenticated users can view competitions" ON competitions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Allow users with roles to manage competitions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'competitions' 
      AND policyname = 'Users with roles can manage competitions'
  ) THEN
    CREATE POLICY "Users with roles can manage competitions" ON competitions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'admin', 'coach')
        )
      );
  END IF;
END $$;

-- Trialists table policies
DO $$ 
BEGIN
  -- Allow authenticated users to read trialists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trialists' 
      AND policyname = 'Authenticated users can view trialists'
  ) THEN
    CREATE POLICY "Authenticated users can view trialists" ON trialists
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Allow users with roles to manage trialists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trialists' 
      AND policyname = 'Users with roles can manage trialists'
  ) THEN
    CREATE POLICY "Users with roles can manage trialists" ON trialists
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
            AND role IN ('superadmin', 'admin', 'coach')
        )
      );
  END IF;
END $$;

-- Verify the policies are working
SELECT 'RLS Policies after fix:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('players', 'training_sessions', 'competitions', 'trialists')
ORDER BY tablename, policyname;