-- Verifica le policy RLS per training_convocati

-- 1. Controlla se RLS è abilitato sulla tabella
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasoids
FROM pg_tables 
WHERE tablename = 'training_convocati';

-- 2. Mostra tutte le policy RLS per training_convocati
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command_type,
    pol.polpermissive as is_permissive,
    pol.polroles as roles,
    pol.polqual as qual_expression,
    pol.polwithcheck as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'training_convocati';

-- 3. Verifica RLS anche per la tabella players (usata nel JOIN)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'players';

-- 4. Policy per players
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command_type,
    pol.polpermissive as is_permissive,
    pol.polroles as roles,
    pol.polqual as qual_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'players';

-- 5. Controlla il current_user e current_setting per capire il contesto
SELECT 
    current_user,
    current_setting('request.jwt.claims', true) as jwt_claims,
    current_setting('request.jwt.claim.sub', true) as user_id;

-- 6. Test: prova ad accedere ai convocati con diversi contesti
-- (questa query potrebbe essere bloccata da RLS)
SELECT 
    tc.id,
    tc.session_id,
    tc.player_id,
    tc.created_at
FROM training_convocati tc
WHERE tc.session_id = '805aa4fd-9dbd-4cb2-be78-d1fe07dded7a'
LIMIT 5;