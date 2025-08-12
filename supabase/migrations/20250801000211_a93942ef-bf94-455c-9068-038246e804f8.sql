-- Rimuovi il foreign key constraint che collega user_roles a auth.users
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Ora aggiungi il ruolo mancante per l'utente Alepdn
INSERT INTO public.user_roles (user_id, role) 
VALUES ('ed2ac7c2-1223-4a04-9d2c-d82559b3e347', 'player')
ON CONFLICT (user_id, role) DO NOTHING;