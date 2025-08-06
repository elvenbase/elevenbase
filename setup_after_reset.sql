-- Setup dopo il reset del database
-- Ricrea il record di admin_setup per permettere la registrazione

-- 1. Verifica che admin_setup esista
SELECT 'Verifica admin_setup' as step;
SELECT * FROM admin_setup;

-- 2. Se non esiste, ricrealo
INSERT INTO admin_setup (setup_token, is_completed, expires_at)
VALUES (gen_random_uuid()::text, false, NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- 3. Verifica il setup
SELECT 'SETUP COMPLETATO' as status;
SELECT * FROM admin_setup;

-- 4. Verifica che non ci siano utenti
SELECT 'UTENTI RIMANENTI' as status;
SELECT COUNT(*) as users_count FROM auth.users; 