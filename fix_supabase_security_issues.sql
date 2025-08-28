-- FIX: Problemi di sicurezza Supabase Linter
-- Risolve tutti gli errori e warnings rilevati

-- ===== ERRORI RLS =====
-- 1. Elimina tabelle backup vecchie (non servono più)
DROP TABLE IF EXISTS backup_teams_20250127;
DROP TABLE IF EXISTS backup_team_invites_20250127;
DROP TABLE IF EXISTS backup_user_roles_20250127;
DROP TABLE IF EXISTS backup_team_members_20250127;

SELECT 'TABELLE BACKUP ELIMINATE' as status;

-- ===== WARNINGS SEARCH_PATH =====
-- 2. Fix search_path per tutte le funzioni (SET search_path = '')

-- Fix handle_new_user_registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  BEGIN
    -- Crea sempre il profilo SENZA email (colonna non esiste)
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (
      NEW.id, 
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Log l'errore ma non bloccare la registrazione
    RAISE WARNING 'Errore inserimento profilo per %: %', NEW.email, SQLERRM;
  END;
  
  -- Solo coach@elevenbase.pro diventa superadmin automaticamente
  IF NEW.email = 'coach@elevenbase.pro' THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
      VALUES (NEW.id, 'superadmin', NOW(), NOW())
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Errore assegnazione superadmin per %: %', NEW.email, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix is_superadmin
CREATE OR REPLACE FUNCTION is_superadmin(_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'superadmin'
  );
END;
$$;

-- Fix is_team_founder  
CREATE OR REPLACE FUNCTION is_team_founder(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = _team_id 
    AND user_id = _user_id 
    AND role = 'founder'
  );
END;
$$;

-- Fix can_manage_team
CREATE OR REPLACE FUNCTION can_manage_team(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Superadmin può gestire tutto
  IF public.is_superadmin(_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Founder o admin attivi del team
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = _team_id 
    AND user_id = _user_id 
    AND role IN ('founder', 'admin')
    AND status = 'active'
  );
END;
$$;

-- Fix can_view_team
CREATE OR REPLACE FUNCTION can_view_team(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Superadmin può vedere tutto
  IF public.is_superadmin(_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Qualsiasi membro attivo del team
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = _team_id 
    AND user_id = _user_id 
    AND status = 'active'
  );
END;
$$;

SELECT 'FUNZIONI HELPER FIXATE' as status;