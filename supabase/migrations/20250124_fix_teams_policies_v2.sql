-- ============================================
-- FIX TEAMS TABLE RLS POLICIES V2
-- Date: 2025-01-24
-- ============================================

-- 1. First, list ALL existing policies on teams table
SELECT 
  polname as policy_name,
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

-- 2. Drop ALL existing policies (including the ones with different names)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT polname 
    FROM pg_policy 
    WHERE polrelid = 'public.teams'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', r.polname);
    RAISE NOTICE 'Dropped policy: %', r.polname;
  END LOOP;
END $$;

-- 3. Verify all policies are gone
SELECT COUNT(*) as remaining_policies FROM pg_policy WHERE polrelid = 'public.teams'::regclass;

-- 4. Create new, simple policies

-- Allow authenticated users to create their own teams
CREATE POLICY "Anyone can create teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
);

-- Allow users to view teams they belong to or own
CREATE POLICY "View own teams"
ON public.teams
FOR SELECT
USING (
  owner_id = auth.uid()
  OR 
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_members.team_id = teams.id 
    AND team_members.user_id = auth.uid()
  )
);

-- Allow team owners to update
CREATE POLICY "Owners can update"
ON public.teams
FOR UPDATE
USING (owner_id = auth.uid());

-- Allow team owners to delete
CREATE POLICY "Owners can delete"
ON public.teams
FOR DELETE
USING (owner_id = auth.uid());

-- 5. Ensure RLS is enabled
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 6. Also fix team_members policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT polname 
    FROM pg_policy 
    WHERE polrelid = 'public.team_members'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', r.polname);
    RAISE NOTICE 'Dropped policy on team_members: %', r.polname;
  END LOOP;
END $$;

-- Create simple team_members policies
CREATE POLICY "Users can be added to teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  auth.uid() IN (
    SELECT owner_id FROM public.teams WHERE id = team_id
  )
);

CREATE POLICY "View team members"
ON public.team_members
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  auth.uid() IN (
    SELECT owner_id FROM public.teams WHERE id = team_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm2
    WHERE tm2.team_id = team_members.team_id
    AND tm2.user_id = auth.uid()
  )
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 7. Final check
SELECT 
  'Teams policies:' as table_name,
  COUNT(*) as policy_count
FROM pg_policy
WHERE polrelid = 'public.teams'::regclass
UNION ALL
SELECT 
  'Team_members policies:' as table_name,
  COUNT(*) as policy_count
FROM pg_policy
WHERE polrelid = 'public.team_members'::regclass;

-- ============================================
-- END
-- ============================================