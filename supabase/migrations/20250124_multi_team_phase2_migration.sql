-- ============================================
-- MULTI-TEAM MIGRATION - PHASE 2: DATA MIGRATION
-- Date: 2025-01-24
-- Description: Migrate existing data to Ca De Rissi SG team
-- Author: Migration System
-- ============================================

-- ============================================
-- STEP 1: CLEAN UP OLD DATA (as requested)
-- ============================================

-- Delete all trial-related data
DELETE FROM public.trial_evaluations;
DELETE FROM public.quick_trial_evaluations;
DELETE FROM public.trialists;

-- Delete all training-related data
DELETE FROM public.training_attendance;
DELETE FROM public.training_convocati;
DELETE FROM public.training_lineups;
DELETE FROM public.training_sessions;

-- Delete all match-related data
DELETE FROM public.match_attendance;
DELETE FROM public.match_player_stats;
DELETE FROM public.matches;

-- Delete competitions (since matches are gone)
DELETE FROM public.competitions;

-- ============================================
-- STEP 2: CREATE DEFAULT TEAM - Ca De Rissi SG
-- ============================================

-- Insert the Ca De Rissi SG team
-- Note: You'll need to replace 'YOUR_USER_ID' with your actual user ID
DO $$
DECLARE
  default_team_id UUID;
  owner_user_id UUID;
BEGIN
  -- Get the first superadmin user as owner (you can change this)
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
  
  -- Store the team ID for reference
  RAISE NOTICE 'Created default team with ID: %', default_team_id;
  
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
  
  -- Link team_members to players based on email matching
  -- Nota: I giocatori potrebbero non avere un campo email, quindi questa parte è opzionale
  -- Se vuoi collegare manualmente giocatori a utenti, lo faremo dopo
  
  -- Tentativo di match automatico (commentato per ora, da fare manualmente dopo)
  /*
  UPDATE public.team_members 
  SET player_id = p.id
  FROM public.players p, auth.users u
  WHERE team_members.team_id = default_team_id
    AND team_members.user_id = u.id
    AND p.team_id = default_team_id
    AND (
      -- Match by name similarity
      lower(p.first_name || ' ' || p.last_name) LIKE '%' || lower(split_part(u.email, '@', 1)) || '%'
    );
  */
  
  -- Update any remaining app settings or configurations
  UPDATE public.app_settings
  SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{default_team_id}',
    to_jsonb(default_team_id)
  )
  WHERE id IS NOT NULL;
  
END $$;

-- ============================================
-- STEP 5: CREATE INITIAL INVITE CODES
-- ============================================

-- Create some initial invite codes for the team
DO $$
DECLARE
  team_id UUID;
BEGIN
  -- Get the Ca De Rissi SG team ID
  SELECT id INTO team_id 
  FROM public.teams 
  WHERE abbreviation = 'CDR' 
  LIMIT 1;
  
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
END $$;

-- ============================================
-- STEP 6: VERIFY MIGRATION
-- ============================================

-- Check the migration results
DO $$
DECLARE
  team_count INTEGER;
  member_count INTEGER;
  player_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count FROM public.teams;
  SELECT COUNT(*) INTO member_count FROM public.team_members WHERE status = 'active';
  SELECT COUNT(*) INTO player_count FROM public.players WHERE team_id IS NOT NULL;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Teams created: %', team_count;
  RAISE NOTICE '  Team members: %', member_count;
  RAISE NOTICE '  Players assigned to team: %', player_count;
  
  IF team_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: No teams created';
  END IF;
END $$;

-- ============================================
-- END OF PHASE 2
-- ============================================

-- Note: After running this migration:
-- 1. Check that all users are properly assigned to the team
-- 2. Verify the team owner is correct
-- 3. Test the invite codes
-- 4. Update the application code to handle multi-team