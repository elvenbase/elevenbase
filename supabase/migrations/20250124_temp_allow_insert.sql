-- ============================================
-- TEMPORARY: Allow team creation without auth check
-- Date: 2025-01-24
-- ============================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Create own teams" ON public.teams;

-- Create a VERY permissive policy just for testing
-- ⚠️ WARNING: This is NOT secure for production!
CREATE POLICY "Create own teams TEMP"
ON public.teams
FOR INSERT
WITH CHECK (
  owner_id IS NOT NULL
  AND created_by IS NOT NULL
  AND owner_id = created_by
);

-- Check the policy
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'teams'
  AND cmd = 'INSERT';

-- ============================================
-- REMEMBER TO FIX THIS AFTER TESTING!
-- ============================================