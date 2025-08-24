-- ============================================
-- MULTI-TEAM MIGRATION - PHASE 2: DATA MIGRATION (FIXED)
-- Date: 2025-01-24
-- Description: Migrate existing data to Ca De Rissi SG team
-- Author: Migration System
-- ============================================

-- ============================================
-- STEP 1: CLEAN UP OLD DATA (as requested)
-- ============================================

-- Delete all trial-related data
DELETE FROM public.trial_evaluations;
DELETE FROM public.quick_trial_evaluations WHERE EXISTS (SELECT 1 FROM public.quick_trial_evaluations LIMIT 1);
DELETE FROM public.trialists;

-- Delete all training-related data
DELETE FROM public.training_attendance;
DELETE FROM public.training_convocati WHERE EXISTS (SELECT 1 FROM public.training_convocati LIMIT 1);
DELETE FROM public.training_lineups WHERE EXISTS (SELECT 1 FROM public.training_lineups LIMIT 1);
DELETE FROM public.training_sessions;

-- Delete all match-related data
DELETE FROM public.match_attendance;
DELETE FROM public.match_player_stats WHERE EXISTS (SELECT 1 FROM public.match_player_stats LIMIT 1);
DELETE FROM public.matches;

-- Delete competitions (since matches are gone)
DELETE FROM public.competitions;

-- ============================================
-- STEP 2: CREATE DEFAULT TEAM - Ca De Rissi SG
-- ============================================

-- Insert the Ca De Rissi SG team
DO $$
DECLARE
  default_team_id UUID;
  owner_user_id UUID;
  team_exists BOOLEAN;
BEGIN
  -- Check if team already exists
  SELECT EXISTS(SELECT 1 FROM public.teams WHERE abbreviation = 'CDR') INTO team_exists;
  
  IF team_exists THEN
    RAISE NOTICE 'Team CDR already exists, skipping creation';
    SELECT id INTO default_team_id FROM public.teams WHERE abbreviation = 'CDR' LIMIT 1;
  ELSE
    -- Get the first superadmin user as owner
    SELECT user_id INTO owner_user_id
    FROM public.user_roles
    WHERE role = 'superadmin'
    LIMIT 1;
    
    -- If no superadmin found, get first admin
    IF owner_user_id IS NULL THEN
      SELECT user_id INTO owner_user_id
      FROM public.user_roles
      WHERE role = 'admin'
      LIMIT 1;
    END IF;
    
    -- If still no user found, get any authenticated user
    IF owner_user_id IS NULL THEN
      SELECT id INTO owner_user_id
      FROM auth.users
      LIMIT 1;
    END IF;
    
    -- Create the default team
    INSERT INTO public.teams (
      name,
      fc_name,
      abbreviation,
      invite_code,
      primary_color,
      secondary_color,
      owner_id,
      created_by,
      settings
    ) VALUES (
      'Ca De Rissi SG',
      'Ca De Rissi SG',
      'CDR',
      'CDR' || substring(md5(random()::text) from 1 for 5), -- CDR + 5 random chars
      '#DC2626', -- Rosso (Red) primary color
      '#1E40AF', -- Blu (Blue) secondary color
      owner_user_id,
      owner_user_id,
      jsonb_build_object(
        'is_default_team', true,
        'migrated_from_single_tenant', true,
        'migration_date', NOW()
      )
    ) RETURNING id INTO default_team_id;
    
    RAISE NOTICE 'Created default team with ID: %', default_team_id;
  END IF;
  
  -- ============================================
  -- STEP 3: MIGRATE EXISTING USERS TO TEAM
  -- ============================================
  
  -- Add all existing users with roles to the team
  INSERT INTO public.team_members (team_id, user_id, role, status, joined_at)
  SELECT 
    default_team_id,
    ur.user_id,
    CASE 
      WHEN ur.role IN ('superadmin', 'admin') THEN 'admin'
      WHEN ur.role = 'coach' THEN 'coach'
      ELSE 'player'
    END as team_role,
    'active',
    NOW()
  FROM public.user_roles ur
  WHERE ur.user_id IS NOT NULL
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- ============================================
  -- STEP 4: ASSOCIATE EXISTING DATA WITH TEAM
  -- ============================================
  
  -- Update all players to belong to the default team
  UPDATE public.players 
  SET team_id = default_team_id 
  WHERE team_id IS NULL;
  
  -- Note: Linking team_members to players will be done manually later
  -- as it requires matching logic that depends on your specific data
  
  RAISE NOTICE 'Migration completed for team %', default_team_id;
  
END $$;

-- ============================================
-- STEP 5: CREATE INITIAL INVITE CODES
-- ============================================

DO $$
DECLARE
  team_id UUID;
  invite_exists BOOLEAN;
BEGIN
  -- Get the Ca De Rissi SG team ID
  SELECT id INTO team_id 
  FROM public.teams 
  WHERE abbreviation = 'CDR' 
  LIMIT 1;
  
  IF team_id IS NULL THEN
    RAISE EXCEPTION 'Team CDR not found!';
  END IF;
  
  -- Check if invites already exist
  SELECT EXISTS(SELECT 1 FROM public.team_invites ti WHERE ti.team_id = team_id) INTO invite_exists;
  
  IF NOT invite_exists THEN
    -- Create admin invite (single use)
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      team_id,
      'CDRADMIN' || substring(md5(random()::text) from 1 for 4),
      'admin',
      1,
      NOW() + INTERVAL '30 days'
    );
    
    -- Create coach invite (5 uses)
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      team_id,
      'CDRCOACH' || substring(md5(random()::text) from 1 for 4),
      'coach',
      5,
      NOW() + INTERVAL '30 days'
    );
    
    -- Create player invite (50 uses)
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      team_id,
      'CDRPLAY' || substring(md5(random()::text) from 1 for 5),
      'player',
      50,
      NOW() + INTERVAL '90 days'
    );
    
    RAISE NOTICE 'Created initial invite codes for Ca De Rissi SG';
  ELSE
    RAISE NOTICE 'Invite codes already exist for team CDR';
  END IF;
END $$;

-- ============================================
-- STEP 6: VERIFY MIGRATION
-- ============================================

DO $$
DECLARE
  team_count INTEGER;
  member_count INTEGER;
  player_count INTEGER;
  invite_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count FROM public.teams WHERE abbreviation = 'CDR';
  SELECT COUNT(*) INTO member_count FROM public.team_members tm 
    JOIN public.teams t ON t.id = tm.team_id 
    WHERE t.abbreviation = 'CDR' AND tm.status = 'active';
  SELECT COUNT(*) INTO player_count FROM public.players p
    JOIN public.teams t ON t.id = p.team_id
    WHERE t.abbreviation = 'CDR';
  SELECT COUNT(*) INTO invite_count FROM public.team_invites ti
    JOIN public.teams t ON t.id = ti.team_id
    WHERE t.abbreviation = 'CDR';
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Team CDR created: %', team_count;
  RAISE NOTICE '  Team members: %', member_count;
  RAISE NOTICE '  Players assigned to team: %', player_count;
  RAISE NOTICE '  Invite codes created: %', invite_count;
  RAISE NOTICE '================================';
  
  IF team_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: No teams created';
  END IF;
END $$;

-- ============================================
-- STEP 7: SHOW INVITE CODES
-- ============================================

SELECT 
  'Invite Codes for Ca De Rissi SG:' as info
UNION ALL
SELECT 
  '  ' || role || ': ' || code || ' (max uses: ' || max_uses || ', expires: ' || expires_at::date || ')'
FROM public.team_invites ti
JOIN public.teams t ON t.id = ti.team_id
WHERE t.abbreviation = 'CDR'
ORDER BY 1;

-- ============================================
-- END OF PHASE 2 (FIXED)
-- ============================================