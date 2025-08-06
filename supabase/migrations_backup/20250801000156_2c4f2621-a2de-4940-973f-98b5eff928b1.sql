-- Aggiungi il ruolo mancante per l'utente Alepdn
INSERT INTO public.user_roles (user_id, role) 
VALUES ('ed2ac7c2-1223-4a04-9d2c-d82559b3e347', 'player')
ON CONFLICT (user_id, role) DO NOTHING;