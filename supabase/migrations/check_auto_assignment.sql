-- Verifica se c'è qualcosa che assegna automaticamente utenti al team di default

-- 1. Controlla triggers su auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Controlla se c'è un trigger che crea team_members automaticamente
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE prosrc LIKE '%team_members%'
  AND prosrc LIKE '%INSERT%';

-- 3. Verifica la funzione handle_new_user
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. Controlla tutti i team_members creati di recente
SELECT 
    tm.id,
    u.email,
    t.name as team_name,
    tm.role,
    tm.created_at,
    tm.created_by
FROM public.team_members tm
JOIN auth.users u ON u.id = tm.user_id
JOIN public.teams t ON t.id = tm.team_id
WHERE tm.created_at > NOW() - INTERVAL '1 day'
ORDER BY tm.created_at DESC;

-- 5. Verifica se c'è una policy o default che assegna automaticamente
SELECT 
    t.name,
    t.metadata,
    COUNT(tm.id) as member_count
FROM public.teams t
LEFT JOIN public.team_members tm ON tm.team_id = t.id
GROUP BY t.id, t.name, t.metadata;