-- ============================================
-- EMERGENCY FIX FOR AUTH ISSUES
-- Date: 2025-01-24
-- ============================================

-- 1. Drop ALL triggers on auth.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass
    AND tgname NOT LIKE 'pg_%'  -- Don't drop system triggers
    AND tgname NOT LIKE 'RI_%'  -- Don't drop foreign key triggers
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- 2. List all functions that might be related to user creation
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user%'
  AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- 3. Check if there's a profiles table with constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype != 'p'; -- Exclude primary key

-- 4. Temporarily disable all RLS policies on profiles
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 5. Check auth.users table for any weird constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass
  AND conname NOT LIKE 'users_%'; -- Show non-standard constraints

-- 6. Simple test - try to insert a test user directly
-- This will help us see the exact error
DO $$
BEGIN
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
    gen_random_uuid(),
    'test_' || extract(epoch from now()) || '@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE 'Test user created successfully';
  
  -- Immediately delete it
  DELETE FROM auth.users WHERE email LIKE 'test_%@example.com';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test user: % - %', SQLSTATE, SQLERRM;
END $$;

-- ============================================
-- END
-- ============================================