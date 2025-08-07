-- Assegna ruolo admin all'utente esistente andrea.camolese@me.com
-- Esegui questo nel SQL Editor di Supabase

-- 1. Verifica se l'utente esiste
SELECT 
  'VERIFICA UTENTE' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'andrea.camolese@me.com';

-- 2. Assegna il ruolo admin usando la funzione
SELECT 
  'ASSEGNAZIONE ADMIN' as status,
  assign_admin_role('andrea.camolese@me.com') as admin_assigned;

-- 3. Verifica il risultato
SELECT 
  'RISULTATO FINALE' as status,
  au.email,
  au.email_confirmed_at,
  p.username,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ AMMINISTRATORE'
    WHEN ur.role IS NOT NULL THEN '👤 UTENTE'
    ELSE '❌ SENZA RUOLO'
  END as status_ruolo
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.email = 'andrea.camolese@me.com';

-- 4. Mostra tutti i ruoli nel sistema
SELECT 
  'TUTTI I RUOLI' as status,
  au.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC; 