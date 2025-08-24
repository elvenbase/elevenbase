-- ============================================
-- SECURE POLICIES WITHOUT RECURSION
-- Date: 2025-01-24
-- ============================================

-- Drop ALL existing policies to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT polname FROM pg_policy WHERE polrelid = 'public.teams'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', r.polname);
  END LOOP;
  
  FOR r IN 
    SELECT polname FROM pg_policy WHERE polrelid = 'public.team_members'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', r.polname);
  END LOOP;
END $$;

-- ============================================
-- TEAMS POLICIES (NO REFERENCES TO team_members)
-- ============================================

-- 1. Users can create teams (they become the owner)
CREATE POLICY "Create own teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
  AND auth.uid() = created_by
);

-- 2. Users can view teams they own
CREATE POLICY "View owned teams"
ON public.teams
FOR SELECT
USING (owner_id = auth.uid());

-- 3. Users can update teams they own
CREATE POLICY "Update owned teams"
ON public.teams
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 4. Users can delete teams they own
CREATE POLICY "Delete owned teams"
ON public.teams
FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- TEAM_MEMBERS POLICIES (SIMPLE, NO RECURSION)
-- ============================================

-- 1. Users can add themselves to teams
CREATE POLICY "Join teams"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Users can view memberships they're part of
CREATE POLICY "View own memberships"
ON public.team_members
FOR SELECT
USING (user_id = auth.uid());

-- 3. Users can leave teams (delete their membership)
CREATE POLICY "Leave teams"
ON public.team_members
FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- ADD A SEPARATE POLICY FOR TEAM MEMBERS TO VIEW THEIR TEAMS
-- ============================================

-- This avoids recursion by using a subquery approach
CREATE POLICY "View teams as member"
ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid()
  )
);

-- ============================================
-- VERIFY
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;

-- ============================================
-- END
-- ============================================