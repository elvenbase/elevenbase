-- Script per rimuovere il campo location deprecato
-- DA ESEGUIRE SOLO DOPO AVER VERIFICATO CHE LA MIGRAZIONE SIA ANDATA A BUON FINE

-- 1. Verifica che tutti i dati siano stati migrati correttamente
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count 
    FROM training_sessions 
    WHERE location IS NOT NULL 
    AND location != '' 
    AND communication_type IS NULL;
    
    IF unmigrated_count > 0 THEN
        RAISE EXCEPTION 'Trovate % sessioni non migrate. Verificare la migrazione prima di rimuovere il campo location.', unmigrated_count;
    ELSE
        RAISE NOTICE 'Tutte le sessioni sono state migrate correttamente.';
    END IF;
END $$;

-- 2. Rimuovi il campo location
ALTER TABLE training_sessions DROP COLUMN IF EXISTS location;

-- 3. Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE 'Campo location rimosso con successo.';
    RAISE NOTICE 'La migrazione ai campi communication_type e communication_details è completata.';
END $$;