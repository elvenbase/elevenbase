-- Multi-Team Migration Phase 2: Data Migration
-- Purpose: Migrate existing data to multi-team structure
-- Date: 2025-01-24
-- Author: Cursor Agent for Ca De Rissi SG

-- ========================================
-- STEP 1: CREATE DEFAULT TEAM
-- ========================================

-- Create Ca De Rissi SG team
DO $$
DECLARE
  default_team_id UUID;
  owner_user_id UUID;
BEGIN
  -- Get the owner user (a.camolese@gmail.com)
  SELECT id INTO owner_user_id 
  FROM auth.users 
  WHERE email = 'a.camolese@gmail.com' 
  LIMIT 1;
  
  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user a.camolese@gmail.com not found';
  END IF;
  
  -- Create default team
  INSERT INTO public.teams (
    id,
    name,
    fc_name, 
    abbreviation,
    primary_color,
    secondary_color,
    owner_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'Ca De Rissi SG',
    'Ca De Rissi Sport Group',
    'CDR',
    '#DC2626', -- Red
    '#1E40AF', -- Blue
    owner_user_id,
    now(),
    now()
  ) RETURNING id INTO default_team_id;
  
  RAISE NOTICE 'Created default team Ca De Rissi SG with ID: %', default_team_id;
  
  -- Store team_id for next steps
  CREATE TEMP TABLE temp_default_team AS SELECT default_team_id as id;
END $$;

-- ========================================
-- STEP 2: ADD OWNER TO TEAM MEMBERS
-- ========================================

DO $$
DECLARE
  default_team_id UUID;
  owner_user_id UUID;
BEGIN
  -- Get the team and owner IDs
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  SELECT owner_id INTO owner_user_id FROM public.teams WHERE id = default_team_id;
  
  -- Add owner as admin member
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role,
    joined_at,
    created_at,
    updated_at
  ) VALUES (
    default_team_id,
    owner_user_id,
    'admin',
    now(),
    now(),
    now()
  );
  
  RAISE NOTICE 'Added owner as admin member to team';
END $$;

-- ========================================
-- STEP 3: MIGRATE EXISTING DATA
-- ========================================

-- Update players to belong to default team
DO $$
DECLARE
  default_team_id UUID;
  updated_count INTEGER;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  
  UPDATE public.players 
  SET team_id = default_team_id
  WHERE team_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % players to belong to default team', updated_count;
END $$;

-- Update training_sessions to belong to default team
DO $$
DECLARE
  default_team_id UUID;
  updated_count INTEGER;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  
  UPDATE public.training_sessions 
  SET team_id = default_team_id
  WHERE team_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % training sessions to belong to default team', updated_count;
END $$;

-- Update matches to belong to default team
DO $$
DECLARE
  default_team_id UUID;
  updated_count INTEGER;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  
  UPDATE public.matches 
  SET team_id = default_team_id
  WHERE team_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % matches to belong to default team', updated_count;
END $$;

-- Update trialists to belong to default team
DO $$
DECLARE
  default_team_id UUID;
  updated_count INTEGER;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  
  UPDATE public.trialists 
  SET team_id = default_team_id
  WHERE team_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % trialists to belong to default team', updated_count;
END $$;

-- Update competitions to belong to default team
DO $$
DECLARE
  default_team_id UUID;
  updated_count INTEGER;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  
  UPDATE public.competitions 
  SET team_id = default_team_id
  WHERE team_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % competitions to belong to default team', updated_count;
END $$;

-- ========================================
-- STEP 4: CREATE INITIAL INVITE CODES
-- ========================================

DO $$
DECLARE
  default_team_id UUID;
  owner_user_id UUID;
  admin_code TEXT;
  coach_code TEXT;
  player_code TEXT;
BEGIN
  SELECT id INTO default_team_id FROM temp_default_team LIMIT 1;
  SELECT owner_id INTO owner_user_id FROM public.teams WHERE id = default_team_id;
  
  -- Generate invite codes
  SELECT public.generate_team_invite_code() INTO admin_code;
  SELECT public.generate_team_invite_code() INTO coach_code;
  SELECT public.generate_team_invite_code() INTO player_code;
  
  -- Admin invite (1 use, 8 months validity)
  INSERT INTO public.team_invites (
    team_id,
    code,
    role,
    max_uses,
    current_uses,
    expires_at,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    default_team_id,
    admin_code,
    'admin',
    1,
    0,
    now() + INTERVAL '8 months',
    owner_user_id,
    now(),
    now()
  );
  
  -- Coach invite (5 uses, 8 months validity) 
  INSERT INTO public.team_invites (
    team_id,
    code,
    role,
    max_uses,
    current_uses,
    expires_at,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    default_team_id,
    coach_code,
    'coach',
    5,
    0,
    now() + INTERVAL '8 months',
    owner_user_id,
    now(),
    now()
  );
  
  -- Player invite (50 uses, 10 months validity)
  INSERT INTO public.team_invites (
    team_id,
    code,
    role,
    max_uses,
    current_uses,
    expires_at,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    default_team_id,
    player_code,
    'player',
    50,
    0,
    now() + INTERVAL '10 months',
    owner_user_id,
    now(),
    now()
  );
  
  RAISE NOTICE 'Created invite codes:';
  RAISE NOTICE 'Admin (1 use, 8 months): %', admin_code;
  RAISE NOTICE 'Coach (5 uses, 8 months): %', coach_code;
  RAISE NOTICE 'Player (50 uses, 10 months): %', player_code;
END $$;

-- ========================================
-- STEP 5: CLEAN UP TEST DATA (OPTIONAL)
-- ========================================

-- Delete old training sessions and related data (as requested)
DO $$
DECLARE
  deleted_attendance INTEGER;
  deleted_sessions INTEGER;
BEGIN
  -- Delete training attendance first
  DELETE FROM public.training_attendance 
  WHERE session_id IN (
    SELECT id FROM public.training_sessions 
    WHERE session_date < CURRENT_DATE - INTERVAL '30 days'
  );
  GET DIAGNOSTICS deleted_attendance = ROW_COUNT;
  
  -- Delete old training sessions
  DELETE FROM public.training_sessions 
  WHERE session_date < CURRENT_DATE - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old training attendance records', deleted_attendance;
  RAISE NOTICE 'Deleted % old training sessions', deleted_sessions;
END $$;

-- Delete old matches and related data
DO $$
DECLARE
  deleted_match_players INTEGER;
  deleted_matches INTEGER;
BEGIN
  -- Delete match players first (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'match_players') THEN
    DELETE FROM public.match_players 
    WHERE match_id IN (
      SELECT id FROM public.matches 
      WHERE match_date < CURRENT_DATE - INTERVAL '30 days'
    );
    GET DIAGNOSTICS deleted_match_players = ROW_COUNT;
    RAISE NOTICE 'Deleted % old match player records', deleted_match_players;
  END IF;
  
  -- Delete old matches
  DELETE FROM public.matches 
  WHERE match_date < CURRENT_DATE - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_matches = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old matches', deleted_matches;
END $$;

-- ========================================
-- STEP 6: UPDATE RLS POLICIES FOR EXISTING TABLES
-- ========================================

-- Update players policies to be team-aware
DROP POLICY IF EXISTS "Users can view all players" ON public.players;
CREATE POLICY "Users can view players from their teams" 
ON public.players FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches and admins can manage players" ON public.players;
CREATE POLICY "Team coaches and admins can manage team players" 
ON public.players FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
  )
);

-- Update training_sessions policies to be team-aware
DROP POLICY IF EXISTS "Users can view all training sessions" ON public.training_sessions;
CREATE POLICY "Users can view training sessions from their teams" 
ON public.training_sessions FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches and admins can manage training sessions" ON public.training_sessions;
CREATE POLICY "Team coaches and admins can manage team training sessions" 
ON public.training_sessions FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
  )
);

-- Update matches policies to be team-aware
DROP POLICY IF EXISTS "Users can view all matches" ON public.matches;
CREATE POLICY "Users can view matches from their teams" 
ON public.matches FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches and admins can manage matches" ON public.matches;
CREATE POLICY "Team coaches and admins can manage team matches" 
ON public.matches FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
  )
);

-- Update trialists policies to be team-aware
DROP POLICY IF EXISTS "Users can view all trialists" ON public.trialists;
CREATE POLICY "Users can view trialists from their teams" 
ON public.trialists FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches and admins can manage trialists" ON public.trialists;
CREATE POLICY "Team coaches and admins can manage team trialists" 
ON public.trialists FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
  )
);

-- Clean up temp table
DROP TABLE IF EXISTS temp_default_team;

-- ========================================
-- MIGRATION COMPLETED - PHASE 2
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Multi-team migration Phase 2 COMPLETED!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Default team "Ca De Rissi SG" created';
  RAISE NOTICE 'All existing data migrated to default team';
  RAISE NOTICE 'Invite codes generated and logged above';
  RAISE NOTICE 'RLS policies updated for team isolation';
  RAISE NOTICE 'Next step: Implement create_team_for_new_user function';
END $$;