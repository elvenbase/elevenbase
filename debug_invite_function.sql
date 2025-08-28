SELECT 'CHECKING INVITE FUNCTION' as status;

-- Verifica esistenza funzione register_with_invite_code
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'register_with_invite_code';

-- Verifica esistenza tabella team_members  
SELECT 
    'TABLE CHECK' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'team_members'
ORDER BY ordinal_position;

-- Verifica definizione funzione se esiste
SELECT 
    'FUNCTION DEFINITION' as check_type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'register_with_invite_code';

-- Lista tutte le funzioni per sicurezza
SELECT 
    'ALL FUNCTIONS' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;