-- Verifica che il database sia pulito
-- Esegui questo nel SQL Editor di Supabase

-- 1. Conta tutti gli utenti
SELECT 
  'UTENTI TOTALI' as status,
  COUNT(*) as total_users
FROM auth.users;

-- 2. Mostra tutti gli utenti (se ce ne sono)
SELECT 
  'DETTAGLIO UTENTI' as status,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Conta i profili
SELECT 
  'PROFILI TOTALI' as status,
  COUNT(*) as total_profiles
FROM profiles;

-- 4. Conta i ruoli utente
SELECT 
  'RUOLI UTENTE TOTALI' as status,
  COUNT(*) as total_user_roles
FROM user_roles;

-- 5. Verifica setup admin
SELECT 
  'SETUP ADMIN' as status,
  is_completed,
  created_at,
  updated_at
FROM admin_setup;

-- 6. Risultato finale
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = 0 
    THEN '✅ DATABASE PULITO - Nessun utente trovato'
    ELSE '❌ DATABASE NON PULITO - Ci sono ancora utenti'
  END as risultato; 