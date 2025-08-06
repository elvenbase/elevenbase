-- Fix immediato per admin_setup e errori 406
-- Esegui questo nel SQL Editor di Supabase

-- 1. Verifica e ricrea la tabella admin_setup
DROP TABLE IF EXISTS admin_setup CASCADE;

CREATE TABLE admin_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setup_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserisci record iniziale
INSERT INTO admin_setup (setup_token, is_completed, expires_at) 
VALUES (gen_random_uuid()::text, false, NOW() + INTERVAL '7 days');

-- 3. Abilita RLS
ALTER TABLE admin_setup ENABLE ROW LEVEL SECURITY;

-- 4. Policy per accesso pubblico (necessario per il setup iniziale)
DROP POLICY IF EXISTS "Public read access for admin_setup" ON admin_setup;
CREATE POLICY "Public read access for admin_setup" ON admin_setup
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update access for admin_setup" ON admin_setup;
CREATE POLICY "Public update access for admin_setup" ON admin_setup
FOR UPDATE USING (true);

-- 5. Verifica che le estensioni siano abilitate
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 6. Test della tabella
SELECT * FROM admin_setup; 