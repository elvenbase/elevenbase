-- Test Dashboard Data Access Directly
-- Simple test without complex policies

-- First, let's see what policies exist
SELECT 'Current RLS Policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('players', 'training_sessions', 'competitions', 'trialists')
ORDER BY tablename;

-- Test if RLS is enabled on tables
SELECT 'RLS Status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('players', 'training_sessions', 'competitions', 'trialists');

-- Try to access data directly (this should work for superadmin)
SELECT 'Direct Data Test:' as info;

-- Test players
SELECT 'Players:' as table_name, COUNT(*) as total_count, COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM players;

-- Test training sessions  
SELECT 'Training Sessions:' as table_name, COUNT(*) as total_count
FROM training_sessions;

-- Test competitions
SELECT 'Competitions:' as table_name, COUNT(*) as total_count, COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM competitions;

-- Test trialists
SELECT 'Trialists:' as table_name, COUNT(*) as total_count, COUNT(*) FILTER (WHERE status = 'in_prova') as active_count
FROM trialists;