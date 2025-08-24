-- ============================================
-- ALLOW UNCONFIRMED USERS TO CREATE TEAMS
-- Date: 2025-01-24
-- ============================================

-- Drop the existing create policy
DROP POLICY IF EXISTS "Create own teams" ON public.teams;

-- Create new policy that allows team creation even without email confirmation
-- The user still needs to be authenticated (have an account)
-- But doesn't need email_confirmed_at to be set
CREATE POLICY "Create own teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = owner_id
  AND auth.uid() = created_by
);

-- Similarly for team_members
DROP POLICY IF EXISTS "Join teams" ON public.team_members;

CREATE POLICY "Join teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- But for SELECT/UPDATE/DELETE, we might want to require email confirmation
-- This way they can create but not access until confirmed

-- Optional: Require email confirmation for viewing teams
DROP POLICY IF EXISTS "View owned teams" ON public.teams;
CREATE POLICY "View owned teams"
ON public.teams
FOR SELECT
USING (
  owner_id = auth.uid()
  -- Uncomment next line to require email confirmation for viewing
  -- AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL)
);

-- ============================================
-- END
-- ============================================