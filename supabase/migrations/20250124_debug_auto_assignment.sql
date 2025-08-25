-- DEBUG: Trova cosa sta assegnando automaticamente utenti al team di default

-- 1. Controlla TUTTI i trigger su auth.users
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    t.tgenabled as enabled,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
ORDER BY t.tgname;

-- 2. Cerca TUTTE le funzioni che inseriscono in team_members
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE prosrc LIKE '%INSERT%team_members%'
   OR prosrc LIKE '%team_members%INSERT%';

-- 3. Controlla se c'è qualche funzione che assegna al team di default
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE prosrc LIKE '%Ca De Rissi%'
   OR prosrc LIKE '%CDR%'
   OR prosrc LIKE '%default_team%';

-- 4. Verifica se user_roles ha un trigger che crea team_members
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'user_roles'
ORDER BY t.tgname;

-- 5. Controlla quando è stato creato il team_member per a.camolese+2
SELECT 
    u.email,
    u.created_at as user_created,
    tm.created_at as member_created,
    (tm.created_at - u.created_at) as time_difference,
    tm.created_by,
    t.name as team_name
FROM auth.users u
JOIN public.team_members tm ON tm.user_id = u.id
JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'a.camolese+2@gmail.com';