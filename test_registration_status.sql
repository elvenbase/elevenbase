-- Test della funzione get_user_registration_status
-- Per debug del problema "Accesso non autorizzato"

SET search_path = '';

-- Test con il tuo user ID (dal log: b80bd095-c467-4457-b452-a3b2bdaf6c83)
SELECT 
    'TEST FUNZIONE get_user_registration_status' as test,
    public.get_user_registration_status('b80bd095-c467-4457-b452-a3b2bdaf6c83'::uuid) as result;

-- Verifica dati raw dell'utente
SELECT 
    'DATI RAW UTENTE' as info,
    id,
    email,
    email_confirmed_at
FROM auth.users 
WHERE id = 'b80bd095-c467-4457-b452-a3b2bdaf6c83'::uuid;

-- Verifica team_members per questo utente
SELECT 
    'TEAM_MEMBERS UTENTE' as info,
    tm.id,
    tm.team_id,
    tm.role,
    tm.status,
    tm.ea_sports_id,
    t.name as team_name,
    t.abbreviation
FROM public.team_members tm
JOIN public.teams t ON tm.team_id = t.id
WHERE tm.user_id = 'b80bd095-c467-4457-b452-a3b2bdaf6c83'::uuid;

-- Verifica se l'utente è superadmin
SELECT 
    'CHECK SUPERADMIN' as info,
    public.is_superadmin('b80bd095-c467-4457-b452-a3b2bdaf6c83'::uuid) as is_superadmin;

-- Verifica user_roles
SELECT 
    'USER_ROLES' as info,
    ur.user_id,
    ur.role
FROM public.user_roles ur
WHERE ur.user_id = 'b80bd095-c467-4457-b452-a3b2bdaf6c83'::uuid;