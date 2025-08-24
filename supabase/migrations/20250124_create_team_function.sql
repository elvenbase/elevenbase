-- ============================================
-- CREATE TEAM FUNCTION - CALLABLE WITH ANON KEY
-- Date: 2025-01-24
-- ============================================

-- Create a function that can be called with the anon key
CREATE OR REPLACE FUNCTION public.create_team_for_new_user(
  p_name TEXT,
  p_fc_name TEXT,
  p_abbreviation TEXT,
  p_primary_color TEXT,
  p_secondary_color TEXT,
  p_owner_id UUID,
  p_invite_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner
AS $$
DECLARE
  v_team_id UUID;
  v_result JSON;
BEGIN
  -- Create the team
  INSERT INTO public.teams (
    name,
    fc_name,
    abbreviation,
    primary_color,
    secondary_color,
    owner_id,
    created_by,
    invite_code
  ) VALUES (
    p_name,
    p_fc_name,
    p_abbreviation,
    p_primary_color,
    p_secondary_color,
    p_owner_id,
    p_owner_id,
    p_invite_code
  ) RETURNING id INTO v_team_id;
  
  -- Add the owner as admin member
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role,
    status
  ) VALUES (
    v_team_id,
    p_owner_id,
    'admin',
    'active'
  );
  
  -- Create initial invite codes
  INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at)
  VALUES 
    (v_team_id, p_abbreviation || 'ADMIN' || substring(md5(random()::text) from 1 for 4), 'admin', 1, NOW() + INTERVAL '30 days'),
    (v_team_id, p_abbreviation || 'COACH' || substring(md5(random()::text) from 1 for 4), 'coach', 5, NOW() + INTERVAL '30 days'),
    (v_team_id, p_abbreviation || 'PLAYER' || substring(md5(random()::text) from 1 for 4), 'player', 50, NOW() + INTERVAL '60 days');
  
  -- Return the created team
  SELECT json_build_object(
    'id', id,
    'name', name,
    'fc_name', fc_name,
    'abbreviation', abbreviation
  ) INTO v_result
  FROM public.teams
  WHERE id = v_team_id;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_team_for_new_user TO anon;
GRANT EXECUTE ON FUNCTION public.create_team_for_new_user TO authenticated;

-- ============================================
-- END
-- ============================================