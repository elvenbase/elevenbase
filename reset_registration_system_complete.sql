-- ============================================
-- RESET COMPLETO SISTEMA REGISTRAZIONE
-- Nuovo sistema: Founder, Admin, Player con approvazioni
-- Data: 2025-01-27
-- ============================================

-- STEP 1: BACKUP DATI ESISTENTI (per sicurezza)
-- ============================================

CREATE TABLE IF NOT EXISTS backup_user_roles AS 
SELECT * FROM user_roles;

CREATE TABLE IF NOT EXISTS backup_team_members AS 
SELECT * FROM team_members;

-- STEP 2: PULIZIA SISTEMA ESISTENTE
-- ============================================

-- Rimuovi policies esistenti che potrebbero conflittare
DROP POLICY IF EXISTS "Team members can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Rimuovi trigger esistenti
DROP TRIGGER IF EXISTS handle_new_user_profile ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_profile();

-- STEP 3: NUOVO SCHEMA DATABASE
-- ============================================

-- 3.1 Pulisci e ricrea user_roles (solo per superadmin)
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role = 'superadmin') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3.2 Ricrea team_members con nuovo schema
DROP TABLE IF EXISTS team_members CASCADE;
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- NUOVI RUOLI SEMPLIFICATI
  role TEXT NOT NULL CHECK (role IN ('founder', 'admin', 'player')),
  
  -- SISTEMA STATUS CON APPROVAZIONI
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  
  -- DATI SPECIFICI
  ea_sports_id TEXT, -- Obbligatorio per player
  
  -- GESTIONE INVITI E APPROVAZIONI
  invited_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- METADATI
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CONSTRAINTS
  UNIQUE(team_id, user_id),
  
  -- EA Sports ID obbligatorio per player
  CONSTRAINT ea_sports_required_for_player 
    CHECK (role != 'player' OR ea_sports_id IS NOT NULL),
    
  -- Founder deve essere sempre active
  CONSTRAINT founder_always_active 
    CHECK (role != 'founder' OR status = 'active')
);

-- 3.3 Aggiorna team_invites per ruoli specifici
ALTER TABLE team_invites 
DROP CONSTRAINT IF EXISTS team_invites_role_check;

ALTER TABLE team_invites 
ADD CONSTRAINT team_invites_role_check 
CHECK (role IN ('admin', 'player'));

-- STEP 4: INDEXES PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_ea_sports ON team_members(ea_sports_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- STEP 6: FUNZIONI HELPER AGGIORNATE
-- ============================================

-- Funzione per check superadmin globale
CREATE OR REPLACE FUNCTION is_superadmin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per check founder del team
CREATE OR REPLACE FUNCTION is_team_founder(_team_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = _team_id 
    AND user_id = _user_id 
    AND role = 'founder'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per check se utente può gestire team
CREATE OR REPLACE FUNCTION can_manage_team(_team_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    is_superadmin(_user_id) OR
    is_team_founder(_team_id, _user_id) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = _team_id 
      AND user_id = _user_id 
      AND role = 'admin'
      AND status = 'active'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per check se utente può vedere team
CREATE OR REPLACE FUNCTION can_view_team(_team_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    is_superadmin(_user_id) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = _team_id 
      AND user_id = _user_id 
      AND status = 'active'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: RLS POLICIES
-- ============================================

-- User Roles Policies (solo superadmin)
CREATE POLICY "Superadmin can view all user roles" 
  ON user_roles FOR SELECT 
  USING (is_superadmin());

CREATE POLICY "Superadmin can manage user roles" 
  ON user_roles FOR ALL 
  USING (is_superadmin());

-- Team Members Policies
CREATE POLICY "Users can view team members of their teams" 
  ON team_members FOR SELECT 
  USING (can_view_team(team_id));

CREATE POLICY "Team managers can manage team members" 
  ON team_members FOR ALL 
  USING (can_manage_team(team_id));

CREATE POLICY "Users can insert themselves into teams via invite" 
  ON team_members FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- STEP 8: TRIGGER PER NUOVO UTENTE
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea sempre il profilo
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    NOW(),
    NOW()
  );
  
  -- Solo coach@elevenbase.pro diventa superadmin automaticamente
  IF NEW.email = 'coach@elevenbase.pro' THEN
    INSERT INTO user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'superadmin', NOW(), NOW());
    
    RAISE NOTICE 'Superadmin automatico assegnato a: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attiva trigger
CREATE TRIGGER handle_new_user_registration_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- STEP 9: FUNZIONE PER TRASFERIMENTO FOUNDER
-- ============================================

CREATE OR REPLACE FUNCTION transfer_team_ownership(
  _team_id UUID,
  _new_founder_user_id UUID,
  _reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  _current_founder_id UUID;
  _current_user_id UUID := auth.uid();
BEGIN
  -- Verifica che l'utente corrente sia founder o superadmin
  IF NOT (is_team_founder(_team_id, _current_user_id) OR is_superadmin(_current_user_id)) THEN
    RAISE EXCEPTION 'Solo il founder corrente o un superadmin può trasferire la proprietà';
  END IF;
  
  -- Trova il founder attuale
  SELECT user_id INTO _current_founder_id
  FROM team_members
  WHERE team_id = _team_id AND role = 'founder' AND status = 'active';
  
  IF _current_founder_id IS NULL THEN
    RAISE EXCEPTION 'Nessun founder attivo trovato per questo team';
  END IF;
  
  -- Verifica che il nuovo founder sia membro attivo del team
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = _team_id 
    AND user_id = _new_founder_user_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Il nuovo founder deve essere un membro attivo del team';
  END IF;
  
  -- Esegui il trasferimento in transazione
  BEGIN
    -- Cambia il founder attuale in admin
    UPDATE team_members 
    SET role = 'admin', updated_at = NOW()
    WHERE team_id = _team_id AND user_id = _current_founder_id;
    
    -- Promuovi il nuovo utente a founder
    UPDATE team_members 
    SET role = 'founder', updated_at = NOW()
    WHERE team_id = _team_id AND user_id = _new_founder_user_id;
    
    -- Aggiorna owner_id nella tabella teams
    UPDATE teams 
    SET owner_id = _new_founder_user_id, updated_at = NOW()
    WHERE id = _team_id;
    
    -- Registra il trasferimento
    INSERT INTO team_ownership_transfers (
      team_id, from_user_id, to_user_id, reason, transferred_by
    ) VALUES (
      _team_id, _current_founder_id, _new_founder_user_id, _reason, _current_user_id
    );
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante il trasferimento: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: SETUP INIZIALE SUPERADMIN
-- ============================================

-- Assegna superadmin a coach@elevenbase.pro se esiste
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'coach@elevenbase.pro') THEN
    INSERT INTO user_roles (user_id, role, created_at, updated_at)
    SELECT 
      id, 
      'superadmin',
      NOW(),
      NOW()
    FROM auth.users 
    WHERE email = 'coach@elevenbase.pro'
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin assegnato a coach@elevenbase.pro';
  ELSE
    RAISE NOTICE 'Utente coach@elevenbase.pro non trovato - verrà assegnato automaticamente alla registrazione';
  END IF;
END $$;

-- STEP 11: VERIFICA FINALE
-- ============================================

-- Mostra risultato operazione
SELECT 
  'RESET SISTEMA COMPLETATO' as status,
  (SELECT COUNT(*) FROM user_roles) as superadmin_count,
  (SELECT COUNT(*) FROM team_members) as team_members_count,
  (SELECT COUNT(*) FROM teams) as teams_count;

-- Fine script
RAISE NOTICE 'Sistema di registrazione resettato e configurato con successo!';