-- RESET COMPLETO - Cancella tutto e permette nuovo setup
-- ATTENZIONE: Questo cancellerà TUTTI gli utenti e dati esistenti!

-- 1. Cancella tutti gli utenti esistenti
DELETE FROM auth.users;

-- 2. Reset admin_setup
DROP TABLE IF EXISTS admin_setup CASCADE;

CREATE TABLE admin_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setup_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserisci record di setup
INSERT INTO admin_setup (setup_token, is_completed, expires_at) 
VALUES (gen_random_uuid()::text, false, NOW() + INTERVAL '7 days');

-- 4. Abilita RLS
ALTER TABLE admin_setup ENABLE ROW LEVEL SECURITY;

-- 5. Policy per accesso pubblico
DROP POLICY IF EXISTS "Public read access for admin_setup" ON admin_setup;
CREATE POLICY "Public read access for admin_setup" ON admin_setup
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update access for admin_setup" ON admin_setup;
CREATE POLICY "Public update access for admin_setup" ON admin_setup
FOR UPDATE USING (true);

-- 6. Verifica il reset
SELECT 'RESET COMPLETO' as status;
SELECT COUNT(*) as users_remaining FROM auth.users;
SELECT * FROM admin_setup; 