-- ============================================
-- CLEANUP TEST USERS
-- Date: 2025-01-24
-- ============================================

-- 1. List all recent test users (created today)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE created_at > CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 2. Delete specific test user by email
-- UNCOMMENT AND MODIFY THE EMAIL TO DELETE
/*
DELETE FROM auth.users 
WHERE email = 'andrea.camolese@me.com';
*/

-- 3. Delete ALL test users created today (BE CAREFUL!)
-- UNCOMMENT TO USE
/*
DELETE FROM auth.users 
WHERE created_at > CURRENT_DATE - INTERVAL '1 day'
  AND email LIKE '%@me.com';  -- Adjust pattern as needed
*/

-- 4. Alternative: Delete users that never confirmed email and were created today
-- UNCOMMENT TO USE
/*
DELETE FROM auth.users 
WHERE created_at > CURRENT_DATE - INTERVAL '1 day'
  AND email_confirmed_at IS NULL;
*/

-- 5. Count users by email domain
SELECT 
  split_part(email, '@', 2) as domain,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM auth.users
GROUP BY split_part(email, '@', 2)
ORDER BY count DESC;

-- ============================================
-- SPECIFIC CLEANUP FOR YOUR TEST
-- ============================================

-- Delete the specific test user you just created
DELETE FROM auth.users 
WHERE id = 'b5a07f66-5162-4c75-8320-148bc444776d'
RETURNING email, created_at;

-- Or delete by email if you prefer
DELETE FROM auth.users 
WHERE email = 'andrea.camolese@me.com'
  AND email_confirmed_at IS NULL  -- Only if not confirmed
RETURNING id, email, created_at;

-- Verify deletion
SELECT 
  'Remaining users with @me.com:' as info,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@me.com';

-- ============================================
-- END
-- ============================================