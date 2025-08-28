-- FIX: Schema tabella teams - aggiungere colonna created_by mancante
-- Il sistema si aspetta created_by ma non esiste

-- 1. Verifica schema attuale tabella teams
SELECT 
    'TEAMS SCHEMA' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
ORDER BY ordinal_position;

-- 2. Aggiunge colonna created_by se mancante
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Popola created_by per team esistenti (usa owner_id)
UPDATE teams 
SET created_by = owner_id 
WHERE created_by IS NULL;

-- 4. Verifica fix
SELECT 
    'TEAMS AFTER FIX' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('owner_id', 'created_by')
ORDER BY column_name;

SELECT 'TEAMS SCHEMA FIXATO' as status;