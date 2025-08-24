-- Multi-Team Function: create_team_for_new_user
-- Purpose: Create team for new user without authentication requirement
-- Date: 2025-01-24
-- Author: Cursor Agent for Ca De Rissi SG

-- ========================================
-- CREATE TEAM FUNCTION (CALLABLE WITH ANON KEY)
-- ========================================

CREATE OR REPLACE FUNCTION public.create_team_for_new_user(
  user_email TEXT,
  team_name TEXT,
  fc_name TEXT,
  abbreviation TEXT,
  primary_color TEXT DEFAULT '#DC2626',
  secondary_color TEXT DEFAULT '#1E40AF'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id UUID;
  new_team_id UUID;
  admin_invite_code TEXT;
  coach_invite_code TEXT;
  player_invite_code TEXT;
  result JSON;
BEGIN
  -- Validate inputs
  IF user_email IS NULL OR team_name IS NULL OR fc_name IS NULL OR abbreviation IS NULL THEN
    RAISE EXCEPTION 'user_email, team_name, fc_name, and abbreviation are required';
  END IF;
  
  IF length(abbreviation) > 3 THEN
    RAISE EXCEPTION 'abbreviation must be 3 characters or less';
  END IF;
  
  -- Get user ID from email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Check if team name already exists
  IF EXISTS (SELECT 1 FROM public.teams WHERE name = team_name) THEN
    RAISE EXCEPTION 'Team name % already exists', team_name;
  END IF;
  
  -- Check if user already belongs to a team
  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = user_id) THEN
    RAISE EXCEPTION 'User already belongs to a team';
  END IF;
  
  -- Generate unique invite codes
  SELECT public.generate_team_invite_code() INTO admin_invite_code;
  SELECT public.generate_team_invite_code() INTO coach_invite_code;
  SELECT public.generate_team_invite_code() INTO player_invite_code;
  
  -- Create the team
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
    team_name,
    fc_name,
    upper(abbreviation),
    primary_color,
    secondary_color,
    user_id,
    now(),
    now()
  ) RETURNING id INTO new_team_id;
  
  -- Add user as admin member
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role,
    joined_at,
    created_at,
    updated_at
  ) VALUES (
    new_team_id,
    user_id,
    'admin',
    now(),
    now(),
    now()
  );
  
  -- Create admin invite code (1 use, 8 months)
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
    new_team_id,
    admin_invite_code,
    'admin',
    1,
    0,
    now() + INTERVAL '8 months',
    user_id,
    now(),
    now()
  );
  
  -- Create coach invite code (5 uses, 8 months)
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
    new_team_id,
    coach_invite_code,
    'coach',
    5,
    0,
    now() + INTERVAL '8 months',
    user_id,
    now(),
    now()
  );
  
  -- Create player invite code (50 uses, 10 months)
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
    new_team_id,
    player_invite_code,
    'player',
    50,
    0,
    now() + INTERVAL '10 months',
    user_id,
    now(),
    now()
  );
  
  -- Prepare result
  result := json_build_object(
    'success', true,
    'team_id', new_team_id,
    'team_name', team_name,
    'fc_name', fc_name,
    'abbreviation', upper(abbreviation),
    'primary_color', primary_color,
    'secondary_color', secondary_color,
    'invite_codes', json_build_object(
      'admin', admin_invite_code,
      'coach', coach_invite_code,
      'player', player_invite_code
    )
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSON
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant execute permission to anon (for post-registration calls)
GRANT EXECUTE ON FUNCTION public.create_team_for_new_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- Grant execute permission to authenticated users (for manual calls)
GRANT EXECUTE ON FUNCTION public.create_team_for_new_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ========================================
-- CREATE TEAM JOIN FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.join_team_with_code(
  user_email TEXT,
  invite_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id UUID;
  invite_record RECORD;
  result JSON;
BEGIN
  -- Validate inputs
  IF user_email IS NULL OR invite_code IS NULL THEN
    RAISE EXCEPTION 'user_email and invite_code are required';
  END IF;
  
  -- Get user ID from email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Check if user already belongs to a team
  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = user_id) THEN
    RAISE EXCEPTION 'User already belongs to a team';
  END IF;
  
  -- Get invite details
  SELECT * INTO invite_record
  FROM public.team_invites 
  WHERE code = upper(invite_code)
    AND expires_at > now()
    AND current_uses < max_uses;
  
  IF invite_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role,
    joined_at,
    created_at,
    updated_at
  ) VALUES (
    invite_record.team_id,
    user_id,
    invite_record.role,
    now(),
    now(),
    now()
  );
  
  -- Update invite usage
  UPDATE public.team_invites 
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = invite_record.id;
  
  -- Get team info
  SELECT json_build_object(
    'success', true,
    'team_id', t.id,
    'team_name', t.name,
    'fc_name', t.fc_name,
    'abbreviation', t.abbreviation,
    'primary_color', t.primary_color,
    'secondary_color', t.secondary_color,
    'role', invite_record.role
  ) INTO result
  FROM public.teams t
  WHERE t.id = invite_record.team_id;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSON
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions for join function
GRANT EXECUTE ON FUNCTION public.join_team_with_code(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.join_team_with_code(TEXT, TEXT) TO authenticated;

-- ========================================
-- FUNCTION COMPLETED
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Team creation functions implemented!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'create_team_for_new_user: Create new team';
  RAISE NOTICE 'join_team_with_code: Join existing team';
  RAISE NOTICE 'Both functions callable with ANON KEY';
  RAISE NOTICE 'Ready for frontend integration';
END $$;