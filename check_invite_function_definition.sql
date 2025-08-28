-- Verifica definizione completa della funzione register_with_invite_code
SELECT 
    'FUNCTION DEFINITION' as check_type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'register_with_invite_code';

-- Verifica esistenza tabella team_members
SELECT 
    'TEAM_MEMBERS CHECK' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'team_members'
ORDER BY ordinal_position;