-- Multi-Team Rollback Script
-- Purpose: Rollback multi-team migration to single-tenant state
-- Date: 2025-01-24
-- Author: Cursor Agent for Ca De Rissi SG
-- WARNING: This will delete all team-related data and revert to single-tenant

-- ========================================
-- STEP 1: REMOVE RLS POLICIES
-- ========================================

-- Drop team-related policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Team owners can manage their teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update team info" ON public.teams;

DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams via valid invites" ON public.team_members;

DROP POLICY IF EXISTS "Team members can view team invites" ON public.team_invites;
DROP POLICY IF EXISTS "Team admins can manage team invites" ON public.team_invites;

-- Restore original policies for existing tables
DROP POLICY IF EXISTS "Users can view players from their teams" ON public.players;
DROP POLICY IF EXISTS "Team coaches and admins can manage team players" ON public.players;

DROP POLICY IF EXISTS "Users can view training sessions from their teams" ON public.training_sessions;
DROP POLICY IF EXISTS "Team coaches and admins can manage team training sessions" ON public.training_sessions;

DROP POLICY IF EXISTS "Users can view matches from their teams" ON public.matches;
DROP POLICY IF EXISTS "Team coaches and admins can manage team matches" ON public.matches;

DROP POLICY IF EXISTS "Users can view trialists from their teams" ON public.trialists;
DROP POLICY IF EXISTS "Team coaches and admins can manage team trialists" ON public.trialists;

-- Recreate original single-tenant policies
CREATE POLICY "Users can view all players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage players" ON public.players FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view all training sessions" ON public.training_sessions FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage training sessions" ON public.training_sessions FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view all matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage matches" ON public.matches FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view all trialists" ON public.trialists FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage trialists" ON public.trialists FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- ========================================
-- STEP 2: DROP FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS public.create_team_for_new_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.join_team_with_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_current_team(UUID);
DROP FUNCTION IF EXISTS public.user_belongs_to_team(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_team_role(UUID, UUID);
DROP FUNCTION IF EXISTS public.generate_team_invite_code();

-- ========================================
-- STEP 3: DROP INDEXES
-- ========================================

-- Team-related indexes
DROP INDEX IF EXISTS idx_teams_owner_id;
DROP INDEX IF EXISTS idx_teams_abbreviation;
DROP INDEX IF EXISTS idx_team_members_team_id;
DROP INDEX IF EXISTS idx_team_members_user_id;
DROP INDEX IF EXISTS idx_team_members_role;
DROP INDEX IF EXISTS idx_team_invites_team_id;
DROP INDEX IF EXISTS idx_team_invites_code;
DROP INDEX IF EXISTS idx_team_invites_expires_at;

-- Existing tables team_id indexes
DROP INDEX IF EXISTS idx_players_team_id;
DROP INDEX IF EXISTS idx_training_sessions_team_id;
DROP INDEX IF EXISTS idx_matches_team_id;
DROP INDEX IF EXISTS idx_trialists_team_id;
DROP INDEX IF EXISTS idx_competitions_team_id;

-- ========================================
-- STEP 4: REMOVE TEAM_ID COLUMNS
-- ========================================

-- Remove team_id from existing tables
ALTER TABLE public.players DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.training_sessions DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.matches DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.trialists DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.competitions DROP COLUMN IF EXISTS team_id;

-- Remove team_id from match_players if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'match_players' AND column_name = 'team_id') THEN
        ALTER TABLE public.match_players DROP COLUMN team_id;
    END IF;
END $$;

-- ========================================
-- STEP 5: DROP TEAM TABLES
-- ========================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.team_invites;
DROP TABLE IF EXISTS public.team_members;  
DROP TABLE IF EXISTS public.teams;

-- ========================================
-- STEP 6: REVOKE PERMISSIONS
-- ========================================

-- Note: Functions already dropped, but if they existed:
-- REVOKE EXECUTE ON FUNCTION public.create_team_for_new_user FROM anon;
-- REVOKE EXECUTE ON FUNCTION public.join_team_with_code FROM anon;

-- ========================================
-- ROLLBACK COMPLETED
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Multi-team rollback COMPLETED!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'All team-related tables dropped';
  RAISE NOTICE 'team_id columns removed from existing tables';
  RAISE NOTICE 'Original single-tenant policies restored';
  RAISE NOTICE 'Functions and indexes cleaned up';
  RAISE NOTICE 'System reverted to single-tenant state';
END $$;