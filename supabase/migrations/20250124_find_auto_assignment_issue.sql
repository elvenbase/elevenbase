-- TROVA IL PROBLEMA DELL'ASSEGNAZIONE AUTOMATICA

-- 1. Verifica se la funzione create_team_for_new_user sta facendo qualcosa di strano
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_team_for_new_user';

-- 2. Controlla TUTTI i team_members per a.camolese+2@gmail.com
SELECT 
    tm.*,
    t.name as team_name,
    u.email
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
JOIN auth.users u ON u.id = tm.user_id
WHERE u.email LIKE 'a.camolese%@gmail.com'
ORDER BY tm.created_at DESC;

-- 3. Verifica quando è stato creato l'utente e quando è stato aggiunto al team
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    tm.created_at as member_created,
    t.name as team_name,
    tm.role,
    tm.created_by
FROM auth.users u
LEFT JOIN public.team_members tm ON tm.user_id = u.id
LEFT JOIN public.teams t ON t.id = tm.team_id
WHERE u.email = 'a.camolese+2@gmail.com';

-- 4. Controlla se c'è qualche default o trigger nascosto
SELECT 
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'team_members'
  AND n.nspname = 'public';

-- 5. IMPORTANTE: Verifica se durante la migrazione abbiamo creato membri per TUTTI gli utenti
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_members FROM public.team_members;
SELECT COUNT(*) as cdr_members 
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
WHERE t.name = 'Ca De Rissi SG';