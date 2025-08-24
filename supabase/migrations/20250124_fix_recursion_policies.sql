-- ============================================
-- FIX RECURSION IN POLICIES
-- Date: 2025-01-24
-- ============================================

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "View own teams" ON public.teams;
DROP POLICY IF EXISTS "View team members" ON public.team_members;

-- 2. Create fixed policy for teams WITHOUT recursion
CREATE POLICY "View own teams"
ON public.teams
FOR SELECT
USING (
  owner_id = auth.uid()
  OR 
  id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Create fixed policy for team_members WITHOUT recursion
CREATE POLICY "View team members"
ON public.team_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  team_id IN (
    SELECT id FROM public.teams 
    WHERE owner_id = auth.uid()
  )
);

-- 4. Verify the policies
SELECT 
  polname as policy_name,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as operation
FROM pg_policy
WHERE polrelid IN ('public.teams'::regclass, 'public.team_members'::regclass)
ORDER BY polrelid::text, polname;

-- ============================================
-- END
-- ============================================