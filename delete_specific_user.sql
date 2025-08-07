-- Cancella utente specifico a.camolese@gmail.com
-- Esegui questo nel SQL Editor di Supabase

-- 1. Prima vediamo l'utente
SELECT 
  'UTENTE DA CANCELLARE' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 2. Cancella l'utente specifico
DELETE FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 3. Pulisci anche le tabelle correlate
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com'
);

DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com'
);

-- 4. Verifica che sia stato cancellato
SELECT 
  'VERIFICA CANCELLAZIONE' as status,
  COUNT(*) as users_remaining 
FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 5. Mostra tutti gli utenti rimanenti
SELECT 
  'TUTTI GLI UTENTI RIMANENTI' as status,
  COUNT(*) as total_users
FROM auth.users; 