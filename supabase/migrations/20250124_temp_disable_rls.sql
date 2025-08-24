-- ============================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Date: 2025-01-24
-- ============================================

-- TEMPORARY: Disable RLS on teams table for testing
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;

-- Also check team_members
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Check status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members');

-- ============================================
-- REMEMBER TO RE-ENABLE AFTER TESTING!
-- 
-- ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- ============================================