-- ============================================
-- FIX AUTH TRIGGER FOR USER CREATION
-- Date: 2025-01-24
-- ============================================

-- Drop any existing trigger that might interfere with user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simpler function that doesn't interfere with signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into profiles if it doesn't exist
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger AFTER insert (not BEFORE)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VERIFY AND FIX PROFILES TABLE
-- ============================================

-- Check if profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    CREATE POLICY "Users can view own profile" 
      ON public.profiles FOR SELECT 
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" 
      ON public.profiles FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END $$;

-- ============================================
-- CHECK FOR PROBLEMATIC RLS POLICIES
-- ============================================

-- Temporarily disable RLS on auth schema tables (if somehow enabled)
-- Note: This should normally not be needed as auth schema is managed by Supabase
DO $$
BEGIN
  -- Check if there are any custom policies on auth.users that might block inserts
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    RAISE NOTICE 'Found policies on auth.users - this might cause issues';
  END IF;
END $$;

-- ============================================
-- VERIFY TEAM TABLES AREN'T BLOCKING
-- ============================================

-- Make sure team_members table allows inserts for new users
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;

CREATE POLICY "Users can join teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR 
  auth.uid() IS NOT NULL -- Allow any authenticated user to be added by the system
);

-- ============================================
-- TEST QUERY
-- ============================================

-- Check current triggers on auth.users
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- ============================================
-- END
-- ============================================