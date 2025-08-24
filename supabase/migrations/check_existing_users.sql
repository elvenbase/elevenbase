-- Check if email already exists
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'andrea.camolese@me.com';

-- Check all users (be careful with sensitive data)
SELECT 
  email,
  created_at,
  email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;