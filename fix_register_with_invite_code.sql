-- Fix della funzione register_with_invite_code con prefissi public.
CREATE OR REPLACE FUNCTION register_with_invite_code(
  _user_id UUID,
  _invite_code TEXT,
  _ea_sports_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Utente già membro di un team';
  END IF;
  
  -- Trova e valida il codice invito
  SELECT 
    ti.*,
    t.name as team_name
  INTO _invite_record
  FROM public.team_invites ti
  JOIN public.teams t ON t.id = ti.team_id
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
    SELECT 1 FROM public.team_members 
    WHERE team_id = _invite_record.team_id 
    AND ea_sports_id = _ea_sports_id
  ) THEN
    RAISE EXCEPTION 'EA Sports ID già utilizzato in questo team';
  END IF;
  
  BEGIN
    -- Registra il nuovo membro (status = pending)
    INSERT INTO public.team_members (
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
    UPDATE public.team_invites 
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
$$;

-- Test della funzione fixata
SELECT 'FUNZIONE REGISTER_WITH_INVITE_CODE FIXATA' as status;