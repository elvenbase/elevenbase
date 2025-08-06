-- Reset completo del setup amministratore
-- Esegui questo nel SQL Editor di Supabase per sbloccare l'app

-- 1. Reset della tabella admin_setup
UPDATE admin_setup 
SET 
  is_completed = false,
  setup_token = gen_random_uuid()::text,
  expires_at = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE id = (SELECT id FROM admin_setup LIMIT 1);

-- 2. Se non ci sono record, ne crea uno nuovo
INSERT INTO admin_setup (setup_token, is_completed, expires_at)
SELECT 
  gen_random_uuid()::text,
  false,
  NOW() + INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM admin_setup);

-- 3. Pulisci eventuali utenti esistenti (opzionale - solo se vuoi partire da zero)
-- ATTENZIONE: Questo cancellerà tutti gli utenti esistenti!
-- Decommenta solo se vuoi un reset completo
-- DELETE FROM auth.users WHERE email != 'your-email@example.com';

-- 4. Verifica il reset
SELECT 
  id,
  setup_token,
  is_completed,
  expires_at,
  created_at,
  updated_at
FROM admin_setup; 