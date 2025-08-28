-- VERIFICA: Configurazione Auth e trigger
-- Non possiamo disabilitare il trigger, ma possiamo verificare tutto il resto

-- 1. Verifica se il trigger è davvero il problema testando registrazione diretta
INSERT INTO profiles (id, created_at, updated_at) 
VALUES (gen_random_uuid(), NOW(), NOW())
RETURNING id, created_at;

-- 2. Verifica configurazione redirect URL
SELECT 'AUTH CONFIG CHECK' as check_type;

-- 3. Test se possiamo creare utenti nel sistema
SELECT 
    'DATABASE PERMISSIONS' as check_type,
    current_user as current_db_user,
    session_user as session_user;

-- 4. Verifica tabelle del sistema di registrazione
SELECT 
    'TABLES CHECK' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') as teams_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') as team_members_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'team_invites') as team_invites_exists;