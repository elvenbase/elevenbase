-- Setup admin user for andrea.camolese@me.com
-- Esegui questo nel SQL Editor di Supabase

-- 1. Prima verifichiamo se l'utente esiste
SELECT 
  'VERIFICA UTENTE' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'andrea.camolese@me.com';

-- 2. Se l'utente esiste, creiamo il profilo se non esiste
INSERT INTO profiles (id, username, created_at, updated_at)
SELECT 
  au.id,
  'andrea.camolese',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'andrea.camolese@me.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- 3. Assegniamo il ruolo di amministratore
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT 
  au.id,
  'admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'andrea.camolese@me.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id AND ur.role = 'admin'
);

-- 4. Verifichiamo il risultato
SELECT 
  'RISULTATO FINALE' as status,
  au.email,
  au.email_confirmed_at,
  p.username,
  ur.role
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.email = 'andrea.camolese@me.com';

-- 5. Mostra tutti i ruoli assegnati
SELECT 
  'TUTTI I RUOLI' as status,
  au.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC; 