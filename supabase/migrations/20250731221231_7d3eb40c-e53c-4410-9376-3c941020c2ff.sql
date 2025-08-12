-- Correggere le funzioni per impostare search_path per sicurezza

-- Funzione per generare token pubblico unico
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Funzione per calcolare allow_responses_until (4 ore prima dell'inizio)  
CREATE OR REPLACE FUNCTION public.calculate_response_deadline(session_date date, start_time time)
RETURNS timestamp with time zone 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (session_date + start_time - interval '4 hours');
END;
$$;

-- Trigger per generare automaticamente token e deadline quando si crea una sessione
CREATE OR REPLACE FUNCTION public.handle_training_session_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Genera token pubblico unico
  NEW.public_link_token = public.generate_public_token();
  
  -- Calcola deadline per le risposte (4 ore prima dell'inizio)
  NEW.allow_responses_until = public.calculate_response_deadline(NEW.session_date, NEW.start_time);
  
  RETURN NEW;
END;
$$;

-- Aggiornare anche la funzione esistente update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aggiornare anche la funzione esistente has_role  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;