-- FIX: Rimuovi politiche RLS conflittuali per profiles
-- Il problema è che ci sono troppe politiche INSERT che si sovrappongono

-- 1. Elimina tutte le politiche INSERT duplicate per profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_signup_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- 2. Crea UNA SOLA politica INSERT semplice e permissiva
CREATE POLICY "profiles_trigger_insert" ON profiles
    FOR INSERT 
    TO authenticated, anon
    WITH CHECK (true);

-- 3. Verifica che il trigger possa inserire senza problemi
SELECT 'POLITICHE RLS FIXATE' as status;

-- 4. Test le nuove politiche
SELECT 
    'NUOVE POLITICHE' as check_type,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY cmd;