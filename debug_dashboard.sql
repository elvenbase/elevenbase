-- Debug Dashboard Data Access
-- Check current user and roles
SELECT 'Current User Info:' as info;
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'Authenticated'
    ELSE 'Not Authenticated'
  END as auth_status;

-- Check if user has roles
SELECT 'User Roles:' as info;
SELECT 
  ur.role,
  ur.role_assigned_at
FROM user_roles ur 
WHERE ur.user_id = auth.uid();

-- Check RLS policies on main tables
SELECT 'RLS Policies:' as info;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('players', 'training_sessions', 'competitions', 'trialists')
ORDER BY tablename, policyname;

-- Test data access for dashboard
SELECT 'Players Count:' as info;
SELECT COUNT(*) as total_players, COUNT(*) FILTER (WHERE status = 'active') as active_players 
FROM players;

SELECT 'Training Sessions Count:' as info;
SELECT COUNT(*) as total_sessions FROM training_sessions;

SELECT 'Competitions Count:' as info;
SELECT COUNT(*) as total_competitions, COUNT(*) FILTER (WHERE is_active = true) as active_competitions 
FROM competitions;

SELECT 'Trialists Count:' as info;
SELECT COUNT(*) as total_trialists, COUNT(*) FILTER (WHERE status = 'in_prova') as active_trials 
FROM trialists;

-- Test recent activity data
SELECT 'Recent Players:' as info;
SELECT first_name, last_name, created_at 
FROM players 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'Recent Training Sessions:' as info;
SELECT title, created_at 
FROM training_sessions 
ORDER BY created_at DESC 
LIMIT 3;