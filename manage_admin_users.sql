-- Gestione utenti amministratori
-- Esegui questo nel SQL Editor di Supabase

-- 1. Verifica utenti esistenti
SELECT 
  'UTENTI ESISTENTI' as status,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verifica ruoli esistenti
SELECT 
  'RUOLI ESISTENTI' as status,
  au.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC;

-- 3. Assegna ruolo admin a andrea.camolese@me.com (se esiste)
SELECT assign_admin_role('andrea.camolese@me.com') as admin_assigned;

-- 4. Verifica risultato finale
SELECT 
  'RISULTATO FINALE' as status,
  au.email,
  au.email_confirmed_at,
  p.username,
  p.full_name,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ AMMINISTRATORE'
    WHEN ur.role IS NOT NULL THEN '👤 UTENTE'
    ELSE '❌ SENZA RUOLO'
  END as status_ruolo
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
ORDER BY ur.role DESC NULLS LAST, au.created_at DESC;

-- 5. Funzioni disponibili per la gestione
-- Per assegnare admin a un altro utente:
-- SELECT assign_admin_role('email@example.com');

-- Per rimuovere admin (esegui manualmente):
-- DELETE FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email@example.com') AND role = 'admin'; 