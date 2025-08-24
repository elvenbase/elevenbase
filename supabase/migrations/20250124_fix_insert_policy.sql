-- ============================================
-- FIX INSERT POLICY - NO RECURSION
-- Date: 2025-01-24
-- ============================================

-- 1. Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Users can be added to teams" ON public.team_members;

-- 2. Create a SIMPLE insert policy for team_members
CREATE POLICY "Users can join teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- 3. Verify all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;

-- ============================================
-- END
-- ============================================