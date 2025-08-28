-- VERIFICA: Signature esatta della funzione register_founder_with_team
SELECT 
    'FUNCTION SIGNATURE' as check_type,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'register_founder_with_team';

-- Verifica anche tutte le funzioni che iniziano con 'register'
SELECT 
    'ALL REGISTER FUNCTIONS' as check_type,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE 'register%';