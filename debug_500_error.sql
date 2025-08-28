-- DEBUG: Verifica completa sistema di registrazione
-- Questo script aiuta a identificare il problema del 500 error

-- 1. Verifica schema tabella profiles
SELECT 
    'SCHEMA PROFILES' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verifica trigger esistente
SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user_registration_trigger';

-- 3. Verifica funzione trigger
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user_registration';

-- 4. Test manuale della funzione (simulando una registrazione)
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'debug@test.com';
BEGIN
    -- Tenta di eseguire manualmente quello che fa il trigger
    RAISE NOTICE 'Testing con user_id: %, email: %', test_user_id, test_email;
    
    -- Test inserimento profilo
    BEGIN
        INSERT INTO profiles (id, created_at, updated_at)
        VALUES (test_user_id, NOW(), NOW());
        RAISE NOTICE 'Profile inserito correttamente';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRORE Profile: %', SQLERRM;
    END;
    
    -- Cleanup
    DELETE FROM profiles WHERE id = test_user_id;
END $$;

-- 5. Controlla se ci sono vincoli o politiche RLS che bloccano
SELECT 
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Verifica che la tabella auth.users esista e sia accessibile
SELECT 
    'AUTH USERS CHECK' as check_type,
    COUNT(*) as user_count
FROM auth.users 
LIMIT 1;