-- Elimina solo l'utente specifico a.camolese@gmail.com
-- ATTENZIONE: Questo elimina solo questo utente, non tutto il database

-- 1. Trova l'ID dell'utente
SELECT id, email FROM auth.users WHERE email = 'a.camolese@gmail.com';

-- 2. Elimina l'utente da auth.users
DELETE FROM auth.users WHERE email = 'a.camolese@gmail.com';

-- 3. Elimina record correlati da user_roles
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com'
);

-- 4. Elimina record correlati da profiles
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com'
);

-- 5. Verifica che sia stato eliminato
SELECT 'UTENTE ELIMINATO' as status;
SELECT COUNT(*) as users_remaining FROM auth.users; 