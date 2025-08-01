-- Aggiungi il campo status alla tabella profiles
ALTER TABLE public.profiles 
ADD COLUMN status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive'));

-- Aggiorna l'utente Alepdn esistente 
UPDATE public.profiles 
SET status = 'inactive' 
WHERE username = 'Alepdn';

-- Crea una funzione per verificare se un utente è attivo
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT status = 'active'
  FROM public.profiles
  WHERE id = _user_id
$$;