-- ============================================
-- FIX TEAMS TABLE RLS POLICIES
-- Date: 2025-01-24
-- ============================================

-- Drop all existing policies on teams table
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;

-- Create new, more permissive policies

-- 1. Allow authenticated users to create teams
CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
  AND auth.uid() = created_by
);

-- 2. Allow users to view teams they belong to
CREATE POLICY "Users can view teams they belong to"
ON public.teams
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.team_members 
    WHERE team_id = teams.id
  )
  OR owner_id = auth.uid()
  OR is_public = true
);

-- 3. Allow team owners to update their teams
CREATE POLICY "Team owners can update their teams"
ON public.teams
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 4. Allow team owners to delete their teams
CREATE POLICY "Team owners can delete their teams"
ON public.teams
FOR DELETE
USING (owner_id = auth.uid());

-- Verify RLS is enabled
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Test the policies
DO $$
DECLARE
  test_user_id UUID;
  test_team_id UUID;
BEGIN
  -- Create a test user ID
  test_user_id := gen_random_uuid();
  
  -- Set the current user for testing
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id::text)::text, true);
  
  -- Try to insert a test team
  INSERT INTO public.teams (
    name, 
    fc_name, 
    abbreviation, 
    invite_code,
    owner_id, 
    created_by
  ) VALUES (
    'Test Team Policy',
    'Test FC',
    'TST',
    'TST' || substring(md5(random()::text) from 1 for 5),
    test_user_id,
    test_user_id
  ) RETURNING id INTO test_team_id;
  
  RAISE NOTICE '✅ Policy test successful - team created with ID: %', test_team_id;
  
  -- Clean up
  DELETE FROM public.teams WHERE id = test_team_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Policy test failed: % - %', SQLSTATE, SQLERRM;
END $$;

-- List current policies
SELECT 
  polname as policy_name,
  polcmd as command,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE 'OTHER'
  END as operation
FROM pg_policy
WHERE polrelid = 'public.teams'::regclass
ORDER BY polname;

-- ============================================
-- END
-- ============================================