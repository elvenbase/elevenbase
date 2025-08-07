-- Forza la conferma dell'email per l'utente
-- Esegui questo nel SQL Editor di Supabase

-- 1. Prima verifica lo stato attuale
SELECT 
  'STATO ATTUALE' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 2. Forza la conferma dell'email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'a.camolese@gmail.com';

-- 3. Verifica il risultato
SELECT 
  'STATO DOPO AGGIORNAMENTO' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 4. Crea un profilo se non esiste
INSERT INTO profiles (id, username, full_name, avatar_url, updated_at)
SELECT 
  id,
  'admin',
  'Administrator',
  NULL,
  NOW()
FROM auth.users 
WHERE email = 'a.camolese@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 5. Assegna ruolo superadmin
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  id,
  'superadmin',
  NOW()
FROM auth.users 
WHERE email = 'a.camolese@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Verifica finale
SELECT 
  'VERIFICA FINALE' as status,
  (SELECT email_confirmed_at FROM auth.users WHERE email = 'a.camolese@gmail.com') as email_confirmed,
  (SELECT COUNT(*) FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com')) as has_profile,
  (SELECT COUNT(*) FROM user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'a.camolese@gmail.com')) as has_role; 