-- Debug RLS policies infinite recursion on teams table

-- Lista tutte le RLS policies sulla tabella teams
SELECT 
    'TEAMS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'teams'
ORDER BY policyname;

-- Verifica dipendenze funzioni nelle policies
SELECT 
    'POLICY DEPENDENCIES' as check_type,
    policyname,
    qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'teams'
AND (qual LIKE '%can_manage_team%' OR qual LIKE '%can_view_team%' OR qual LIKE '%is_superadmin%');

-- Verifica se le funzioni chiamano ricorsivamente la tabella teams
SELECT 
    'FUNCTION DEPENDENCIES' as check_type,
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%teams%' THEN 'USES_TEAMS_TABLE'
        ELSE 'NO_TEAMS_REFERENCE'
    END as teams_dependency
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('can_manage_team', 'can_view_team', 'is_superadmin', 'is_team_founder');