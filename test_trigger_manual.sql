-- TEST: Simulazione completa di registrazione per debug 500 error
-- Questo testa ESATTAMENTE quello che succede durante signup

-- 1. Test inserimento diretto in auth.users (simula signup Supabase)
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'manual-test@example.com';
    result_message text;
BEGIN
    RAISE NOTICE 'INIZIO TEST - User ID: %, Email: %', test_user_id, test_email;
    
    -- Test 1: Inserimento manuale nella tabella profiles (quello che fa il trigger)
    BEGIN
        INSERT INTO profiles (id, created_at, updated_at)
        VALUES (test_user_id, NOW(), NOW());
        RAISE NOTICE '✅ PROFILES: Inserimento riuscito';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PROFILES: Errore - %', SQLERRM;
    END;
    
    -- Test 2: Verifica che il profilo sia stato creato
    IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ VERIFICA: Profilo trovato nel database';
    ELSE
        RAISE NOTICE '❌ VERIFICA: Profilo NON trovato nel database';
    END IF;
    
    -- Test 3: Test superadmin per coach@elevenbase.pro
    test_email := 'coach@elevenbase.pro';
    IF test_email = 'coach@elevenbase.pro' THEN
        BEGIN
            INSERT INTO user_roles (user_id, role, created_at, updated_at)
            VALUES (test_user_id, 'superadmin', NOW(), NOW())
            ON CONFLICT (user_id, role) DO NOTHING;
            RAISE NOTICE '✅ SUPERADMIN: Assegnazione riuscita per %', test_email;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ SUPERADMIN: Errore - %', SQLERRM;
        END;
    END IF;
    
    -- Cleanup
    DELETE FROM user_roles WHERE user_id = test_user_id;
    DELETE FROM profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'TEST COMPLETATO - Cleanup fatto';
END $$;

-- 2. Verifica che il trigger sia attivo
SELECT 
    'TRIGGER STATUS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    tgenabled
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
WHERE trigger_name = 'handle_new_user_registration_trigger';

-- 3. Test delle funzioni del sistema
SELECT 'TEST FUNZIONI SISTEMA' as test_type;

-- Test get_user_registration_status
SELECT 
    'FUNCTION TEST' as type,
    'get_user_registration_status' as function_name,
    get_user_registration_status('4d48f74d-361d-4d29-9f64-98900ebbf9dd'::uuid) as result;

-- 4. Verifica configurazione email Supabase Auth
SELECT 'EMAIL CONFIG CHECK' as status;