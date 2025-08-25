-- Multi-Team Migration Phase 1: Database Structure
-- Purpose: Transform single-tenant to multi-tenant architecture
-- Date: 2025-01-24
-- Author: Cursor Agent for Ca De Rissi SG

-- ========================================
-- STEP 1: CREATE TEAM-RELATED TABLES
-- ========================================

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- "Ca De Rissi SG"
  fc_name TEXT NOT NULL, -- "Football Club name"
  abbreviation TEXT NOT NULL CHECK (length(abbreviation) <= 3), -- "CDR"
  primary_color TEXT NOT NULL DEFAULT '#DC2626', -- Hex color
  secondary_color TEXT NOT NULL DEFAULT '#1E40AF', -- Hex color
  logo_url TEXT, -- Optional team logo
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members table (user-team relationships)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team invite codes
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- 8-character invite code
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT team_invites_uses_check CHECK (current_uses <= max_uses)
);

-- ========================================
-- STEP 2: ADD TEAM_ID TO EXISTING TABLES
-- ========================================

-- Add team_id to players (nullable initially for migration)
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add team_id to training_sessions
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add team_id to training_attendance (via session relationship)
-- No direct team_id needed - inherited from training_sessions

-- Add team_id to matches
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add team_id to match_players (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'match_players') THEN
        ALTER TABLE public.match_players 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add team_id to trialists
ALTER TABLE public.trialists 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Add team_id to trial_evaluations (via trialist relationship)
-- No direct team_id needed - inherited from trialists

-- Add team_id to competitions
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- ========================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Team-related indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON public.teams(abbreviation);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- Team invites indexes
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON public.team_invites(code);
CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at ON public.team_invites(expires_at);

-- Existing tables team_id indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_team_id ON public.training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON public.matches(team_id);
CREATE INDEX IF NOT EXISTS idx_trialists_team_id ON public.trialists(team_id);
CREATE INDEX IF NOT EXISTS idx_competitions_team_id ON public.competitions(team_id);

-- ========================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to get user's current team
CREATE OR REPLACE FUNCTION public.get_user_current_team(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT team_id 
  FROM public.team_members 
  WHERE user_id = user_uuid 
  LIMIT 1;
$$;

-- Function to check if user belongs to team
CREATE OR REPLACE FUNCTION public.user_belongs_to_team(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.team_members 
    WHERE user_id = user_uuid AND team_id = team_uuid
  );
$$;

-- Function to get user's role in team
CREATE OR REPLACE FUNCTION public.get_user_team_role(user_uuid UUID, team_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.team_members 
  WHERE user_id = user_uuid AND team_id = team_uuid;
$$;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_team_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; -- No O, 0 to avoid confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM public.team_invites WHERE code = result) THEN
    RETURN public.generate_team_invite_code(); -- Recursive call if collision
  END IF;
  
  RETURN result;
END;
$$;

-- ========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 6: CREATE RLS POLICIES
-- ========================================

-- Teams policies
CREATE POLICY "Users can view teams they belong to" 
ON public.teams FOR SELECT 
USING (
  id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team owners can manage their teams" 
ON public.teams FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Team admins can update team info" 
ON public.teams FOR UPDATE 
USING (
  id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Team members policies  
CREATE POLICY "Users can view team members of their teams" 
ON public.team_members FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team admins can manage team members" 
ON public.team_members FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('admin')
  )
);

CREATE POLICY "Users can join teams via valid invites" 
ON public.team_members FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  team_id IN (
    SELECT team_id FROM public.team_invites 
    WHERE expires_at > now() AND current_uses < max_uses
  )
);

-- Team invites policies
CREATE POLICY "Team members can view team invites" 
ON public.team_invites FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team admins can manage team invites" 
ON public.team_invites FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- MIGRATION COMPLETED - PHASE 1
-- ========================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-team migration Phase 1 completed successfully';
  RAISE NOTICE 'Next steps: Run Phase 2 to migrate existing data';
END $$;