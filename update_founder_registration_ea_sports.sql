-- Aggiornamento funzione register_founder_with_team per supportare EA Sports ID
-- Eseguire come superadmin su Supabase

SET search_path = '';

-- Drop e ricrea la funzione con supporto EA Sports ID
DROP FUNCTION IF EXISTS public.register_founder_with_team(UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.register_founder_with_team(
  _user_id UUID,
  _team_name TEXT,
  _team_abbreviation TEXT,
  _primary_color TEXT DEFAULT NULL,
  _secondary_color TEXT DEFAULT NULL,
  _ea_sports_id TEXT DEFAULT NULL,
  _ea_sports_team_name TEXT DEFAULT NULL
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
  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Utente già membro di un team';
  END IF;
  
  -- Verifica unicità nome team
  IF EXISTS (SELECT 1 FROM public.teams WHERE name = _team_name) THEN
    RAISE EXCEPTION 'Nome team già esistente';
  END IF;
  
  -- Verifica unicità abbreviazione
  IF EXISTS (SELECT 1 FROM public.teams WHERE abbreviation = _team_abbreviation) THEN
    RAISE EXCEPTION 'Abbreviazione team già esistente';
  END IF;
  
  -- Verifica unicità EA Sports ID se fornito
  IF _ea_sports_id IS NOT NULL AND _ea_sports_id != '' THEN
    IF EXISTS (SELECT 1 FROM public.team_members WHERE ea_sports_id = _ea_sports_id) THEN
      RAISE EXCEPTION 'EA Sports ID già utilizzato da un altro utente';
    END IF;
  END IF;
  
  BEGIN
    -- Crea il team
    INSERT INTO public.teams (
      name, 
      abbreviation, 
      ea_sports_team_name,
      primary_color, 
      secondary_color,
      owner_id,
      created_by,
      is_active
    ) VALUES (
      _team_name,
      _team_abbreviation,
      CASE WHEN _ea_sports_team_name = '' THEN NULL ELSE _ea_sports_team_name END,
      _primary_color,
      _secondary_color,
      _user_id,
      _user_id,
      true
    ) RETURNING id INTO _team_id;
    
    -- Registra il founder come membro attivo con EA Sports ID
    INSERT INTO public.team_members (
      team_id,
      user_id,
      role,
      status,
      ea_sports_id,
      joined_at,
      approved_by,
      approved_at
    ) VALUES (
      _team_id,
      _user_id,
      'founder',
      'active',
      CASE WHEN _ea_sports_id = '' THEN NULL ELSE _ea_sports_id END,
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
      'status', 'active',
      'ea_sports_id', CASE WHEN _ea_sports_id = '' THEN NULL ELSE _ea_sports_id END
    ) INTO _result;
    
    RETURN _result;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante la creazione del team: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test della funzione aggiornata
-- SELECT public.register_founder_with_team(
--   'USER_ID_QUI'::uuid,
--   'Test Team',
--   'TT',
--   '#FF0000',
--   '#00FF00', 
--   'TestFounderEA123'
-- );

-- Verifica che la funzione sia stata aggiornata correttamente
SELECT 
    'FUNCTION UPDATED' as status,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'register_founder_with_team';