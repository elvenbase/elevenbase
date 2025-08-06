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

-- 2. Verifica struttura e inserisci record se necessario
-- Aggiungi colonna setup_token se mancante
ALTER TABLE admin_setup ADD COLUMN IF NOT EXISTS setup_token TEXT;

-- Inserisci record di setup iniziale
INSERT INTO admin_setup (is_completed, expires_at, setup_token) 
VALUES (false, NOW() + INTERVAL '7 days', gen_random_uuid()::text)
ON CONFLICT DO NOTHING;

-- 3. Abilita RLS su admin_setup
ALTER TABLE admin_setup ENABLE ROW LEVEL SECURITY;

-- 4. Policy per admin_setup
DROP POLICY IF EXISTS "Public read access for admin_setup" ON admin_setup;
CREATE POLICY "Public read access for admin_setup" ON admin_setup
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update admin_setup" ON admin_setup;
CREATE POLICY "Authenticated users can update admin_setup" ON admin_setup
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Abilita RLS su tabelle principali se esistono
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players') THEN
        ALTER TABLE players ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public read access players" ON players;
        CREATE POLICY "Public read access players" ON players FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Authenticated users can insert players" ON players;
        CREATE POLICY "Authenticated users can insert players" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_sessions') THEN
        ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can read training sessions" ON training_sessions;
        CREATE POLICY "Users can read training sessions" ON training_sessions FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Authenticated users can create training sessions" ON training_sessions;
        CREATE POLICY "Authenticated users can create training sessions" ON training_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 7. Verifica che le estensioni necessarie siano abilitate
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";