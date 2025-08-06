-- Cancella utenti dalla tabella auth.users
-- Esegui questo nel SQL Editor di Supabase

-- 1. Prima vediamo gli utenti esistenti
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users;

-- 2. Cancella tutti gli utenti
DELETE FROM auth.users;

-- 3. Verifica che siano stati cancellati
SELECT 
  'UTENTI RIMANENTI' as status,
  COUNT(*) as users_count 
FROM auth.users;

-- 4. Pulisci anche le tabelle correlate
DELETE FROM user_roles;
DELETE FROM profiles;

-- 5. Verifica finale
SELECT 
  'PULIZIA COMPLETATA' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM user_roles) as user_roles_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count; 