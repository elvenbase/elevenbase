-- VERIFICA: Sistema registrazione completo
-- Dato che prima funzionava, vediamo cosa manca ora

-- 1. Test della funzione register_founder_with_team (quella chiamata dal frontend)
SELECT 
    'FUNCTION TEST' as test_type,
    proname as function_name,
    prosrc as function_exists
FROM pg_proc 
WHERE proname = 'register_founder_with_team';

-- 2. Verifica che tutte le funzioni del sistema esistano
SELECT 
    'SYSTEM FUNCTIONS' as check_type,
    COUNT(*) as total_functions
FROM pg_proc 
WHERE proname IN (
    'register_founder_with_team',
    'get_user_registration_status', 
    'generate_team_invite',
    'approve_team_member'
);

-- 3. Test rapido della funzione register_founder_with_team
SELECT register_founder_with_team(
    'test-function@example.com',
    'test_function_user',
    'Team Function Test',
    'TFT',
    'Blue',
    'White'
) as test_result;

-- 4. Cleanup del test
DELETE FROM team_members WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'test-function@example.com'
);
DELETE FROM teams WHERE name = 'Team Function Test';
-- Note: Non possiamo eliminare da auth.users, ma va bene per il test

-- 5. Verifica trigger sulla tabella auth.users
SELECT 
    'AUTH TRIGGER CHECK' as check_type,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';