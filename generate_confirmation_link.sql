-- Genera link di conferma email per utente esistente
-- Esegui questo nel SQL Editor di Supabase

-- 1. Trova l'utente
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'a.camolese@gmail.com';

-- 2. Se l'utente esiste e non ha confermato l'email, genera un nuovo token
-- (Questo richiede l'uso delle funzioni di Supabase Auth)

-- 3. Alternativa: resetta la conferma email per permettere nuova conferma
UPDATE auth.users 
SET email_confirmed_at = NULL 
WHERE email = 'a.camolese@gmail.com';

-- 4. Verifica il reset
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'a.camolese@gmail.com'; 