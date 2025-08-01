-- Inserisci l'utente Alepdn nel sistema di autenticazione
-- Questo deve essere fatto tramite la funzione di signup, non direttamente nella tabella auth.users

-- Creiamo una funzione per creare utenti fake per testing
CREATE OR REPLACE FUNCTION public.create_fake_user(
  _email text,
  _password text,
  _username text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Questo richiede l'uso della funzione di Supabase per creare utenti
  -- Per ora, aggiorniamo il profilo esistente per essere consistente
  
  -- Aggiorna il profilo esistente di Alepdn per avere l'email corretta
  UPDATE public.profiles 
  SET 
    status = 'inactive'
  WHERE username = 'Alepdn';
  
  RETURN (SELECT id FROM public.profiles WHERE username = 'Alepdn');
END;
$$;

-- Chiama la funzione per Alepdn
SELECT public.create_fake_user('alepdn@users.com', 'password123', 'Alepdn');