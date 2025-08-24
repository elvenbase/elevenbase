-- ============================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- Date: 2025-01-24
-- ============================================

-- Disable RLS on all team-related tables
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_ownership_transfers DISABLE ROW LEVEL SECURITY;

-- Check status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members', 'team_invites', 'team_ownership_transfers')
ORDER BY tablename;

-- ============================================
-- ⚠️ REMEMBER TO RE-ENABLE AFTER TESTING!
-- 
-- ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.team_ownership_transfers ENABLE ROW LEVEL SECURITY;
-- ============================================