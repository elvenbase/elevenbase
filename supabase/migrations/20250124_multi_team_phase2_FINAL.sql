-- ============================================
-- MULTI-TEAM MIGRATION - PHASE 2: DATA MIGRATION (FINAL)
-- Date: 2025-01-24
-- Description: Migrate existing data to Ca De Rissi SG team
-- ============================================

-- ============================================
-- STEP 1: CLEAN UP OLD DATA
-- ============================================

-- Delete all trial-related data
DELETE FROM public.trial_evaluations WHERE EXISTS (SELECT 1 FROM public.trial_evaluations LIMIT 1);
DELETE FROM public.quick_trial_evaluations WHERE EXISTS (SELECT 1 FROM public.quick_trial_evaluations LIMIT 1);
DELETE FROM public.trialists WHERE EXISTS (SELECT 1 FROM public.trialists LIMIT 1);

-- Delete all training-related data  
DELETE FROM public.training_attendance WHERE EXISTS (SELECT 1 FROM public.training_attendance LIMIT 1);
DELETE FROM public.training_convocati WHERE EXISTS (SELECT 1 FROM public.training_convocati LIMIT 1);
DELETE FROM public.training_lineups WHERE EXISTS (SELECT 1 FROM public.training_lineups LIMIT 1);
DELETE FROM public.training_sessions WHERE EXISTS (SELECT 1 FROM public.training_sessions LIMIT 1);

-- Delete all match-related data
DELETE FROM public.match_attendance WHERE EXISTS (SELECT 1 FROM public.match_attendance LIMIT 1);
DELETE FROM public.match_player_stats WHERE EXISTS (SELECT 1 FROM public.match_player_stats LIMIT 1);
DELETE FROM public.matches WHERE EXISTS (SELECT 1 FROM public.matches LIMIT 1);

-- Delete competitions
DELETE FROM public.competitions WHERE EXISTS (SELECT 1 FROM public.competitions LIMIT 1);

-- ============================================
-- STEP 2: CREATE CA DE RISSI SG TEAM
-- ============================================

DO $$
DECLARE
  v_team_id UUID;
  v_owner_id UUID;
  v_team_exists BOOLEAN;
BEGIN
  -- Check if team already exists
  SELECT EXISTS(SELECT 1 FROM public.teams WHERE abbreviation = 'CDR') INTO v_team_exists;
  
  IF v_team_exists THEN
    SELECT id INTO v_team_id FROM public.teams WHERE abbreviation = 'CDR' LIMIT 1;
    RAISE NOTICE 'Team CDR already exists with ID: %', v_team_id;
  ELSE
    -- Find owner (first superadmin/admin/any user)
    SELECT user_id INTO v_owner_id
    FROM public.user_roles
    WHERE role IN ('superadmin', 'admin')
    ORDER BY 
      CASE role 
        WHEN 'superadmin' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END
    LIMIT 1;
    
    -- If no admin found, get any user
    IF v_owner_id IS NULL THEN
      SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
    END IF;
    
    -- Create the team
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
      'CDR' || substring(md5(random()::text) from 1 for 5),
      '#DC2626', -- Rosso
      '#1E40AF', -- Blu
      v_owner_id,
      v_owner_id,
      jsonb_build_object(
        'is_default_team', true,
        'migrated_from_single_tenant', true,
        'migration_date', NOW()
      )
    ) RETURNING id INTO v_team_id;
    
    RAISE NOTICE 'Created team Ca De Rissi SG with ID: %', v_team_id;
  END IF;
  
  -- ============================================
  -- STEP 3: MIGRATE USERS TO TEAM
  -- ============================================
  
  -- Add existing users to team
  INSERT INTO public.team_members (team_id, user_id, role, status, joined_at)
  SELECT 
    v_team_id,
    ur.user_id,
    CASE 
      WHEN ur.role IN ('superadmin', 'admin') THEN 'admin'
      WHEN ur.role = 'coach' THEN 'coach'
      ELSE 'player'
    END,
    'active',
    NOW()
  FROM public.user_roles ur
  WHERE ur.user_id IS NOT NULL
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- ============================================
  -- STEP 4: ASSIGN PLAYERS TO TEAM
  -- ============================================
  
  UPDATE public.players 
  SET team_id = v_team_id 
  WHERE team_id IS NULL;
  
  RAISE NOTICE 'Players assigned to team CDR';
  
END $$;

-- ============================================
-- STEP 5: CREATE INVITE CODES
-- ============================================

DO $$
DECLARE
  v_team_id UUID;
  v_has_invites BOOLEAN;
BEGIN
  -- Get team ID
  SELECT id INTO v_team_id 
  FROM public.teams 
  WHERE abbreviation = 'CDR' 
  LIMIT 1;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Team CDR not found!';
  END IF;
  
  -- Check for existing invites
  SELECT EXISTS(
    SELECT 1 FROM public.team_invites ti 
    WHERE ti.team_id = v_team_id
  ) INTO v_has_invites;
  
  IF NOT v_has_invites THEN
    -- Admin invite
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      v_team_id,
      'CDRADMIN' || substring(md5(random()::text) from 1 for 4),
      'admin',
      1,
      NOW() + INTERVAL '30 days'
    );
    
    -- Coach invite
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      v_team_id,
      'CDRCOACH' || substring(md5(random()::text) from 1 for 4),
      'coach',
      5,
      NOW() + INTERVAL '30 days'
    );
    
    -- Player invite
    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
    VALUES (
      v_team_id,
      'CDRPLAY' || substring(md5(random()::text) from 1 for 5),
      'player',
      50,
      NOW() + INTERVAL '90 days'
    );
    
    RAISE NOTICE 'Created invite codes for Ca De Rissi SG';
  ELSE
    RAISE NOTICE 'Invite codes already exist';
  END IF;
END $$;

-- ============================================
-- STEP 6: FINAL REPORT
-- ============================================

DO $$
DECLARE
  v_team_count INTEGER;
  v_member_count INTEGER;
  v_player_count INTEGER;
  v_invite_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_team_count 
  FROM public.teams 
  WHERE abbreviation = 'CDR';
  
  SELECT COUNT(*) INTO v_member_count 
  FROM public.team_members tm 
  JOIN public.teams t ON t.id = tm.team_id 
  WHERE t.abbreviation = 'CDR' AND tm.status = 'active';
  
  SELECT COUNT(*) INTO v_player_count 
  FROM public.players p
  JOIN public.teams t ON t.id = p.team_id
  WHERE t.abbreviation = 'CDR';
  
  SELECT COUNT(*) INTO v_invite_count 
  FROM public.team_invites ti
  JOIN public.teams t ON t.id = ti.team_id
  WHERE t.abbreviation = 'CDR';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Team: Ca De Rissi SG (CDR)';
  RAISE NOTICE 'Colors: Rosso (#DC2626) / Blu (#1E40AF)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Teams created: %', v_team_count;
  RAISE NOTICE 'Team members: %', v_member_count;
  RAISE NOTICE 'Players in team: %', v_player_count;
  RAISE NOTICE 'Invite codes: %', v_invite_count;
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================
-- SHOW INVITE CODES
-- ============================================

SELECT 
  '📋 INVITE CODES FOR CA DE RISSI SG' as "Info"
UNION ALL
SELECT 
  '➤ ' || role || ': ' || code || ' (uses: ' || max_uses || ', expires: ' || expires_at::date || ')'
FROM public.team_invites ti
JOIN public.teams t ON t.id = ti.team_id
WHERE t.abbreviation = 'CDR'
ORDER BY 1;

-- ============================================
-- END OF MIGRATION
-- ============================================