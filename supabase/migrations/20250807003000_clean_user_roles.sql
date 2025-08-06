-- Clean user_roles table to allow fresh admin setup
-- This removes any remaining superadmin records

-- 1. Delete all records from user_roles
DELETE FROM user_roles;

-- 2. Verify the cleanup
SELECT COUNT(*) as remaining_user_roles FROM user_roles;

-- 3. Also clean profiles table
DELETE FROM profiles;

-- 4. Verify profiles cleanup
SELECT COUNT(*) as remaining_profiles FROM profiles;

-- 5. Final verification - should show 0 for both
SELECT 
  'CLEANUP COMPLETE' as status,
  (SELECT COUNT(*) FROM user_roles) as user_roles_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count; 