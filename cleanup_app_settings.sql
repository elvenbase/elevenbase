-- Script per pulire le impostazioni app dal database
-- Rimuove la tabella app_settings e tutte le funzioni/politiche correlate

-- Rimuovi le politiche RLS
DROP POLICY IF EXISTS "Authenticated users can view public app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can view all app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can insert app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can delete app settings" ON app_settings;

-- Rimuovi la funzione upsert
DROP FUNCTION IF EXISTS upsert_app_setting(TEXT, TEXT, TEXT, BOOLEAN);

-- Rimuovi gli indici
DROP INDEX IF EXISTS idx_app_settings_key;
DROP INDEX IF EXISTS idx_app_settings_public;
DROP INDEX IF EXISTS idx_app_settings_created_by;

-- Rimuovi la tabella
DROP TABLE IF EXISTS app_settings;

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE 'Tabella app_settings e componenti correlati rimossi con successo';
END $$;