-- Migrazione per aggiungere campi comunicazione strutturati
-- Aggiunge communication_type e communication_details alla tabella training_sessions

-- 1. Aggiungi i nuovi campi
ALTER TABLE training_sessions 
ADD COLUMN communication_type TEXT,
ADD COLUMN communication_details TEXT;

-- 2. Crea l'enum type per communication_type (simulato con constraint)
ALTER TABLE training_sessions 
ADD CONSTRAINT communication_type_check 
CHECK (communication_type IN ('party', 'discord', 'altro') OR communication_type IS NULL);

-- 3. Migra i dati esistenti dal campo location
UPDATE training_sessions 
SET 
  communication_type = CASE 
    WHEN LOWER(location) LIKE '%party%' THEN 'party'
    WHEN LOWER(location) = 'discord' THEN 'discord'
    WHEN location LIKE '%discord.gg%' OR location LIKE '%discord.com%' THEN 'discord'
    WHEN location IS NOT NULL AND location != '' AND LOWER(location) NOT LIKE '%party%' THEN 'altro'
    ELSE NULL
  END,
  communication_details = CASE 
    WHEN location LIKE '%discord.gg%' OR location LIKE '%discord.com%' THEN location
    WHEN location IS NOT NULL AND location != '' AND LOWER(location) != 'party' AND LOWER(location) != 'discord' THEN location
    ELSE NULL
  END
WHERE location IS NOT NULL AND location != '';

-- 4. Aggiorna le sessioni con "Discord" semplice (senza URL)
UPDATE training_sessions 
SET communication_details = NULL
WHERE communication_type = 'discord' AND communication_details = 'Discord';

-- 5. Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE 'Campi comunicazione aggiunti e dati migrati con successo';
    RAISE NOTICE 'Sessioni aggiornate: %', (SELECT COUNT(*) FROM training_sessions WHERE communication_type IS NOT NULL);
END $$;