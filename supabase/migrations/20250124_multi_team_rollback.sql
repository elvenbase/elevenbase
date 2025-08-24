-- ============================================
-- MULTI-TEAM MIGRATION - ROLLBACK SCRIPT
-- Date: 2025-01-24
-- Description: Rollback multi-team changes if needed
-- Author: Migration System
-- ============================================

-- WARNING: This will remove all multi-team functionality
-- Make sure to backup before running this!

-- ============================================
-- STEP 1: DROP POLICIES
-- ============================================

-- Drop team-related policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage invites" ON public.team_invites;
DROP POLICY IF EXISTS "Anyone can view active invites with code" ON public.team_invites;

-- ============================================
-- STEP 2: DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;

-- ============================================
-- STEP 3: DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_team_role(UUID, UUID);
DROP FUNCTION IF EXISTS public.has_team_permission(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.generate_invite_code();

-- ============================================
-- STEP 4: REMOVE TEAM_ID FROM EXISTING TABLES
-- ============================================

-- Remove team_id column from existing tables
ALTER TABLE public.players DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.matches DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.training_sessions DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.competitions DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.trialists DROP COLUMN IF EXISTS team_id;

-- ============================================
-- STEP 5: DROP INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_teams_invite_code;
DROP INDEX IF EXISTS idx_teams_owner;
DROP INDEX IF EXISTS idx_team_members_team;
DROP INDEX IF EXISTS idx_team_members_user;
DROP INDEX IF EXISTS idx_team_members_status;
DROP INDEX IF EXISTS idx_team_invites_code;
DROP INDEX IF EXISTS idx_team_invites_team;
DROP INDEX IF EXISTS idx_players_team;
DROP INDEX IF EXISTS idx_matches_team;
DROP INDEX IF EXISTS idx_training_sessions_team;

-- ============================================
-- STEP 6: DROP TABLES
-- ============================================

-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS public.team_ownership_transfers;
DROP TABLE IF EXISTS public.team_invites;
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.teams;

-- ============================================
-- STEP 7: CLEAN UP APP SETTINGS
-- ============================================

-- Remove default_team_id from app_settings if it exists
UPDATE public.app_settings
SET settings = settings - 'default_team_id'
WHERE settings ? 'default_team_id';

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Check if tables are dropped
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
    RAISE WARNING 'Table teams still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    RAISE WARNING 'Table team_members still exists';
  END IF;
  
  -- Check if columns are removed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'team_id'
  ) THEN
    RAISE WARNING 'Column team_id still exists in players table';
  END IF;
  
  RAISE NOTICE 'Rollback completed. Multi-team functionality has been removed.';
  RAISE NOTICE 'Note: This does NOT restore deleted training/match data from Phase 2.';
END $$;

-- ============================================
-- END OF ROLLBACK
-- ============================================