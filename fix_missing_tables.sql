-- Fix per errori 406 e tabelle mancanti
-- Eseguito automaticamente via Supabase CLI

-- 1. Crea tabella admin_setup
CREATE TABLE IF NOT EXISTS admin_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserisci record di setup iniziale
INSERT INTO admin_setup (is_completed, expires_at) 
VALUES (false, NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- 3. Abilita RLS su admin_setup
ALTER TABLE admin_setup ENABLE ROW LEVEL SECURITY;

-- 4. Policy per admin_setup
CREATE POLICY IF NOT EXISTS "Public read access for admin_setup" ON admin_setup
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update admin_setup" ON admin_setup
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Abilita RLS su tabelle principali se non già fatto
ALTER TABLE IF EXISTS players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendances ENABLE ROW LEVEL SECURITY;

-- 6. Policy base per lettura pubblica (temporanea per testing)
CREATE POLICY IF NOT EXISTS "Public read access players" ON players
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert players" ON players
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Public read access users" ON users  
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can read training sessions" ON training_sessions
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create training sessions" ON training_sessions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Verifica che le estensioni necessarie siano abilitate
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";