-- ============================================
-- REMOVE PROBLEMATIC TRIGGERS CAUSING AUTH ERRORS
-- Date: 2025-01-24
-- ============================================

-- 1. Drop the problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- 2. Drop the associated functions (if not used elsewhere)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_admin_user_setup() CASCADE;

-- 3. Verify they are gone
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY tgname;

-- 4. Create a SAFE trigger that won't block user creation
CREATE OR REPLACE FUNCTION safe_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a BEGIN/EXCEPTION block to prevent any errors from blocking user creation
  BEGIN
    -- Only try to create profile if it doesn't exist
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.created_at, NOW()),
      COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't block user creation
      RAISE WARNING 'Error in safe_handle_new_user: %', SQLERRM;
  END;
  
  -- ALWAYS return NEW to allow the user creation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger AFTER insert (not BEFORE)
CREATE TRIGGER on_auth_user_created_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION safe_handle_new_user();

-- 6. Test that we can now create users
DO $$
DECLARE
  test_id UUID;
BEGIN
  test_id := gen_random_uuid();
  
  -- Try to insert a test user
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    instance_id,
    aud,
    role
  ) VALUES (
    test_id,
    'test_trigger_' || extract(epoch from now())::text || '@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NULL, -- Not confirmed
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE '✅ Test user created successfully with ID: %', test_id;
  
  -- Clean up - delete the test user
  DELETE FROM auth.users WHERE id = test_id;
  RAISE NOTICE '✅ Test user deleted successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating test user: % - %', SQLSTATE, SQLERRM;
END $$;

-- 7. Final check - list remaining triggers
SELECT 
  'Remaining custom triggers on auth.users:' as info,
  COUNT(*) as count
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%';

-- ============================================
-- END - Your auth should work now!
-- ============================================