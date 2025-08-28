-- ============================================
-- FUNZIONI AVANZATE SISTEMA REGISTRAZIONE
-- Gestione completa flussi: Founder, Admin, Player
-- Data: 2025-01-27
-- ============================================

-- FUNZIONE 1: REGISTRAZIONE FOUNDER + CREAZIONE TEAM
-- ============================================

CREATE OR REPLACE FUNCTION register_founder_with_team(
  _user_id UUID,
  _team_name TEXT,
  _team_abbreviation TEXT,
  _primary_color TEXT DEFAULT NULL,
  _secondary_color TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  _team_id UUID;
  _result JSON;
BEGIN
  -- Verifica che l'utente esista
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Utente non trovato';
  END IF;
  
  -- Verifica che l'utente non sia già membro di un team
  IF EXISTS (SELECT 1 FROM team_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Utente già membro di un team';
  END IF;
  
  -- Verifica unicità nome team
  IF EXISTS (SELECT 1 FROM teams WHERE name = _team_name) THEN
    RAISE EXCEPTION 'Nome team già esistente';
  END IF;
  
  -- Verifica unicità abbreviazione
  IF EXISTS (SELECT 1 FROM teams WHERE abbreviation = _team_abbreviation) THEN
    RAISE EXCEPTION 'Abbreviazione team già esistente';
  END IF;
  
  BEGIN
    -- Crea il team
    INSERT INTO teams (
      name, 
      abbreviation, 
      primary_color, 
      secondary_color,
      owner_id,
      created_by,
      is_active
    ) VALUES (
      _team_name,
      _team_abbreviation,
      _primary_color,
      _secondary_color,
      _user_id,
      _user_id,
      true
    ) RETURNING id INTO _team_id;
    
    -- Registra il founder come membro attivo
    INSERT INTO team_members (
      team_id,
      user_id,
      role,
      status,
      joined_at,
      approved_by,
      approved_at
    ) VALUES (
      _team_id,
      _user_id,
      'founder',
      'active',
      NOW(),
      _user_id,  -- Auto-approvato
      NOW()
    );
    
    -- Prepara risultato
    SELECT json_build_object(
      'success', true,
      'team_id', _team_id,
      'team_name', _team_name,
      'role', 'founder',
      'status', 'active'
    ) INTO _result;
    
    RETURN _result;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante la creazione del team: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 2: REGISTRAZIONE CON CODICE INVITO
-- ============================================

CREATE OR REPLACE FUNCTION register_with_invite_code(
  _user_id UUID,
  _invite_code TEXT,
  _ea_sports_id TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  _invite_record RECORD;
  _result JSON;
  _member_id UUID;
BEGIN
  -- Verifica che l'utente esista
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Utente non trovato';
  END IF;
  
  -- Verifica che l'utente non sia già membro di un team
  IF EXISTS (SELECT 1 FROM team_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Utente già membro di un team';
  END IF;
  
  -- Trova e valida il codice invito
  SELECT 
    ti.*,
    t.name as team_name
  INTO _invite_record
  FROM team_invites ti
  JOIN teams t ON t.id = ti.team_id
  WHERE ti.code = _invite_code
    AND ti.is_active = true
    AND ti.expires_at > NOW()
    AND ti.used_count < ti.max_uses;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Codice invito non valido, scaduto o esaurito';
  END IF;
  
  -- Verifica EA Sports ID per player
  IF _invite_record.role = 'player' AND (_ea_sports_id IS NULL OR _ea_sports_id = '') THEN
    RAISE EXCEPTION 'EA Sports ID obbligatorio per i giocatori';
  END IF;
  
  -- Verifica unicità EA Sports ID nel team (se fornito)
  IF _ea_sports_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = _invite_record.team_id 
    AND ea_sports_id = _ea_sports_id
  ) THEN
    RAISE EXCEPTION 'EA Sports ID già utilizzato in questo team';
  END IF;
  
  BEGIN
    -- Registra il nuovo membro (status = pending)
    INSERT INTO team_members (
      team_id,
      user_id,
      role,
      status,
      ea_sports_id,
      invited_by,
      joined_at
    ) VALUES (
      _invite_record.team_id,
      _user_id,
      _invite_record.role,
      'pending',
      _ea_sports_id,
      _invite_record.created_by,
      NOW()
    ) RETURNING id INTO _member_id;
    
    -- Aggiorna contatore utilizzi invito
    UPDATE team_invites 
    SET 
      used_count = used_count + 1,
      last_used_at = NOW(),
      last_used_by = _user_id
    WHERE id = _invite_record.id;
    
    -- Prepara risultato
    SELECT json_build_object(
      'success', true,
      'team_id', _invite_record.team_id,
      'team_name', _invite_record.team_name,
      'role', _invite_record.role,
      'status', 'pending',
      'member_id', _member_id,
      'requires_approval', true
    ) INTO _result;
    
    RETURN _result;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante la registrazione: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 3: APPROVAZIONE MEMBRI IN ATTESA
-- ============================================

CREATE OR REPLACE FUNCTION approve_team_member(
  _member_id UUID,
  _notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  _member_record RECORD;
  _approver_id UUID := auth.uid();
  _result JSON;
BEGIN
  -- Trova il membro da approvare
  SELECT 
    tm.*,
    t.name as team_name,
    u.email as user_email
  INTO _member_record
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  JOIN auth.users u ON u.id = tm.user_id
  WHERE tm.id = _member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro non trovato';
  END IF;
  
  -- Verifica che sia in status pending
  IF _member_record.status != 'pending' THEN
    RAISE EXCEPTION 'Il membro non è in attesa di approvazione';
  END IF;
  
  -- Verifica permessi di approvazione
  IF NOT can_manage_team(_member_record.team_id, _approver_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per approvare membri di questo team';
  END IF;
  
  -- Approva il membro
  UPDATE team_members 
  SET 
    status = 'active',
    approved_by = _approver_id,
    approved_at = NOW(),
    notes = COALESCE(_notes, notes),
    updated_at = NOW()
  WHERE id = _member_id;
  
  -- Prepara risultato
  SELECT json_build_object(
    'success', true,
    'member_id', _member_id,
    'user_email', _member_record.user_email,
    'team_name', _member_record.team_name,
    'role', _member_record.role,
    'approved_at', NOW()
  ) INTO _result;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 4: RIFIUTO MEMBRI IN ATTESA
-- ============================================

CREATE OR REPLACE FUNCTION reject_team_member(
  _member_id UUID,
  _reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  _member_record RECORD;
  _approver_id UUID := auth.uid();
  _result JSON;
BEGIN
  -- Trova il membro da rifiutare
  SELECT 
    tm.*,
    t.name as team_name,
    u.email as user_email
  INTO _member_record
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  JOIN auth.users u ON u.id = tm.user_id
  WHERE tm.id = _member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro non trovato';
  END IF;
  
  -- Verifica che sia in status pending
  IF _member_record.status != 'pending' THEN
    RAISE EXCEPTION 'Il membro non è in attesa di approvazione';
  END IF;
  
  -- Verifica permessi
  IF NOT can_manage_team(_member_record.team_id, _approver_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per rifiutare membri di questo team';
  END IF;
  
  -- Elimina il membro (rifiuto definitivo)
  DELETE FROM team_members WHERE id = _member_id;
  
  -- Prepara risultato
  SELECT json_build_object(
    'success', true,
    'action', 'rejected',
    'user_email', _member_record.user_email,
    'team_name', _member_record.team_name,
    'role', _member_record.role,
    'reason', _reason
  ) INTO _result;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 5: GENERA CODICE INVITO
-- ============================================

CREATE OR REPLACE FUNCTION generate_team_invite(
  _team_id UUID,
  _role TEXT,
  _max_uses INTEGER DEFAULT 1,
  _expires_days INTEGER DEFAULT 7
) RETURNS JSON AS $$
DECLARE
  _invite_code TEXT;
  _invite_id UUID;
  _creator_id UUID := auth.uid();
  _result JSON;
BEGIN
  -- Verifica permessi
  IF NOT can_manage_team(_team_id, _creator_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per creare inviti per questo team';
  END IF;
  
  -- Valida ruolo
  IF _role NOT IN ('admin', 'player') THEN
    RAISE EXCEPTION 'Ruolo invito non valido. Usa: admin o player';
  END IF;
  
  -- Genera codice univoco
  LOOP
    _invite_code := upper(substring(md5(random()::text) from 1 for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM team_invites WHERE code = _invite_code);
  END LOOP;
  
  -- Crea l'invito
  INSERT INTO team_invites (
    team_id,
    code,
    role,
    created_by,
    expires_at,
    max_uses,
    used_count,
    is_active
  ) VALUES (
    _team_id,
    _invite_code,
    _role,
    _creator_id,
    NOW() + INTERVAL '1 day' * _expires_days,
    _max_uses,
    0,
    true
  ) RETURNING id INTO _invite_id;
  
  -- Prepara risultato
  SELECT json_build_object(
    'success', true,
    'invite_id', _invite_id,
    'code', _invite_code,
    'role', _role,
    'max_uses', _max_uses,
    'expires_at', NOW() + INTERVAL '1 day' * _expires_days,
    'created_by', _creator_id
  ) INTO _result;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 6: LISTA MEMBRI IN ATTESA PER APPROVAZIONE
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_approvals(_team_id UUID)
RETURNS TABLE (
  member_id UUID,
  user_id UUID,
  user_email TEXT,
  role TEXT,
  ea_sports_id TEXT,
  joined_at TIMESTAMPTZ,
  invited_by_email TEXT
) AS $$
BEGIN
  -- Verifica permessi
  IF NOT can_manage_team(_team_id, auth.uid()) THEN
    RAISE EXCEPTION 'Non hai i permessi per vedere le approvazioni in attesa';
  END IF;
  
  RETURN QUERY
  SELECT 
    tm.id as member_id,
    tm.user_id,
    u.email as user_email,
    tm.role,
    tm.ea_sports_id,
    tm.joined_at,
    inv.email as invited_by_email
  FROM team_members tm
  JOIN auth.users u ON u.id = tm.user_id
  LEFT JOIN auth.users inv ON inv.id = tm.invited_by
  WHERE tm.team_id = _team_id 
    AND tm.status = 'pending'
  ORDER BY tm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 7: VALIDAZIONE EA SPORTS ID
-- ============================================

CREATE OR REPLACE FUNCTION validate_ea_sports_id(
  _ea_sports_id TEXT,
  _team_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  _result JSON;
  _is_valid BOOLEAN := true;
  _error_msg TEXT := '';
BEGIN
  -- Validazioni formato EA Sports ID
  IF _ea_sports_id IS NULL OR length(trim(_ea_sports_id)) = 0 THEN
    _is_valid := false;
    _error_msg := 'EA Sports ID non può essere vuoto';
  ELSIF length(_ea_sports_id) < 3 THEN
    _is_valid := false;
    _error_msg := 'EA Sports ID troppo corto (minimo 3 caratteri)';
  ELSIF length(_ea_sports_id) > 50 THEN
    _is_valid := false;
    _error_msg := 'EA Sports ID troppo lungo (massimo 50 caratteri)';
  END IF;
  
  -- Verifica unicità nel team (se specificato)
  IF _is_valid AND _team_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = _team_id 
      AND ea_sports_id = _ea_sports_id
    ) THEN
      _is_valid := false;
      _error_msg := 'EA Sports ID già utilizzato in questo team';
    END IF;
  END IF;
  
  -- Prepara risultato
  SELECT json_build_object(
    'valid', _is_valid,
    'ea_sports_id', _ea_sports_id,
    'error', CASE WHEN _is_valid THEN NULL ELSE _error_msg END
  ) INTO _result;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNZIONE 8: GET USER REGISTRATION STATUS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_registration_status(_user_id UUID)
RETURNS JSON AS $$
DECLARE
  _result JSON;
  _member_record RECORD;
  _is_superadmin BOOLEAN;
BEGIN
  -- Check superadmin
  _is_superadmin := is_superadmin(_user_id);
  
  -- Check team membership
  SELECT 
    tm.*,
    t.name as team_name,
    t.abbreviation as team_abbreviation
  INTO _member_record
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = _user_id;
  
  IF FOUND THEN
    -- Utente con team
    SELECT json_build_object(
      'registered', true,
      'has_team', true,
      'is_superadmin', _is_superadmin,
      'team_id', _member_record.team_id,
      'team_name', _member_record.team_name,
      'team_abbreviation', _member_record.team_abbreviation,
      'role', _member_record.role,
      'status', _member_record.status,
      'ea_sports_id', _member_record.ea_sports_id,
      'can_login', (_member_record.status = 'active' OR _is_superadmin)
    ) INTO _result;
  ELSE
    -- Utente senza team
    SELECT json_build_object(
      'registered', true,
      'has_team', false,
      'is_superadmin', _is_superadmin,
      'team_id', NULL,
      'role', NULL,
      'status', NULL,
      'can_login', _is_superadmin,
      'needs_registration', true
    ) INTO _result;
  END IF;
  
  RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fine script
RAISE NOTICE 'Funzioni sistema registrazione create con successo!';