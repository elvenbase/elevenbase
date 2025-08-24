-- ============================================
-- MULTI-TEAM MIGRATION - PHASE 1
-- Date: 2025-01-24
-- Description: Add multi-team support to the application
-- Author: Migration System
-- ============================================

-- IMPORTANTE: Questo script è REVERSIBILE
-- Per fare rollback, esegui: 20250124_multi_team_rollback.sql

-- ============================================
-- STEP 1: CREATE NEW TEAM-RELATED TABLES
-- ============================================

-- 1.1 Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nome della squadra
  fc_name TEXT, -- Nome su FC (Football Club system)
  abbreviation TEXT NOT NULL, -- Sigla (es. CDR)
  invite_code TEXT UNIQUE, -- Codice univoco per inviti (generato automaticamente)
  primary_color TEXT, -- Colore primario (hex)
  secondary_color TEXT, -- Colore secondario (hex)
  logo_url TEXT, -- URL del logo
  owner_id UUID REFERENCES auth.users(id), -- Proprietario del team (trasferibile)
  created_by UUID REFERENCES auth.users(id), -- Chi ha creato il team (storico)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadati aggiuntivi
  settings JSONB DEFAULT '{}', -- Impostazioni team specifiche
  is_active BOOLEAN DEFAULT true, -- Per soft delete
  
  CONSTRAINT teams_name_unique UNIQUE(name),
  CONSTRAINT teams_abbreviation_check CHECK (length(abbreviation) <= 10)
);

-- 1.2 Create team_members table (associazione utenti-team)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player')),
  
  -- Link opzionale a giocatore esistente
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  
  -- Metadati membership
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  invitation_accepted_at TIMESTAMPTZ,
  
  -- Status management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES auth.users(id),
  
  -- Note e permessi custom
  notes TEXT,
  custom_permissions JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un utente può essere in un team con un solo ruolo
  CONSTRAINT unique_user_team UNIQUE(team_id, user_id)
);

-- 1.3 Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- Codice invito univoco
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player')), -- Ruolo assegnato all'invitato
  
  -- Gestione validità
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Limiti utilizzo
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  
  -- Tracking
  last_used_at TIMESTAMPTZ,
  last_used_by UUID REFERENCES auth.users(id),
  
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT invite_uses_check CHECK (used_count <= max_uses)
);

-- 1.4 Create team_ownership_transfers table (per tracciare i trasferimenti)
CREATE TABLE IF NOT EXISTS public.team_ownership_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  transferred_by UUID REFERENCES auth.users(id) -- Chi ha effettuato il trasferimento
);

-- ============================================
-- STEP 2: ADD TEAM_ID TO EXISTING TABLES
-- ============================================

-- IMPORTANTE: Aggiungiamo team_id come NULLABLE per non rompere nulla

-- 2.1 Players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2.2 Matches
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2.3 Training sessions
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2.4 Competitions
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2.5 Trialists
ALTER TABLE public.trialists 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- ============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON public.teams(invite_code);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON public.team_invites(code);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON public.team_invites(team_id);

-- Per le tabelle esistenti
CREATE INDEX IF NOT EXISTS idx_players_team ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_team ON public.matches(team_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_team ON public.training_sessions(team_id);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_ownership_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(
  _team_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id 
    AND user_id = _user_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's role in a team
CREATE OR REPLACE FUNCTION public.get_team_role(
  _team_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.team_members
  WHERE team_id = _team_id 
  AND user_id = _user_id 
  AND status = 'active'
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission in team
CREATE OR REPLACE FUNCTION public.has_team_permission(
  _team_id UUID,
  _permission TEXT,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  user_role := get_team_role(_team_id, _user_id);
  
  -- Check permissions based on role
  IF user_role = 'admin' THEN
    RETURN true; -- Admin can do everything
  ELSIF user_role = 'coach' AND _permission IN ('view', 'manage_training', 'manage_matches', 'manage_players') THEN
    RETURN true;
  ELSIF user_role = 'player' AND _permission = 'view' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.team_invites WHERE team_invites.code = code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================

-- Teams policies
CREATE POLICY "Users can view teams they belong to" 
  ON public.teams FOR SELECT 
  USING (is_team_member(id) OR is_active = true); -- Public teams visible to all

CREATE POLICY "Team owners can update their teams" 
  ON public.teams FOR UPDATE 
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams" 
  ON public.teams FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Team members policies
CREATE POLICY "Team members can view their team members" 
  ON public.team_members FOR SELECT 
  USING (is_team_member(team_id));

CREATE POLICY "Team admins can manage team members" 
  ON public.team_members FOR ALL 
  USING (has_team_permission(team_id, 'manage_team'));

-- Team invites policies
CREATE POLICY "Team admins can manage invites" 
  ON public.team_invites FOR ALL 
  USING (has_team_permission(team_id, 'manage_team'));

CREATE POLICY "Anyone can view active invites with code" 
  ON public.team_invites FOR SELECT 
  USING (is_active = true);

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON public.teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON public.team_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.teams IS 'Tabella principale per gestire le squadre/team';
COMMENT ON TABLE public.team_members IS 'Associazione tra utenti e team con ruoli';
COMMENT ON TABLE public.team_invites IS 'Inviti per unirsi ai team';
COMMENT ON TABLE public.team_ownership_transfers IS 'Storico trasferimenti proprietà team';

COMMENT ON COLUMN public.teams.owner_id IS 'Proprietario attuale del team (può essere trasferito)';
COMMENT ON COLUMN public.teams.created_by IS 'Utente che ha creato il team (immutabile per storico)';
COMMENT ON COLUMN public.team_members.role IS 'Ruolo utente nel team: admin, coach, player';
COMMENT ON COLUMN public.team_members.status IS 'Stato membership: pending, active, suspended, removed';

-- ============================================
-- END OF PHASE 1
-- ============================================