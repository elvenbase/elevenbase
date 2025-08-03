-- ============================================================================
-- MIGRATION: Aggiungi opzione avatar giocatori
-- ============================================================================
-- Aggiunge il campo use_player_avatars alla tabella png_export_settings
-- ============================================================================

-- Aggiungi colonna per l'opzione di utilizzare gli avatar dei giocatori
ALTER TABLE png_export_settings 
ADD COLUMN IF NOT EXISTS use_player_avatars BOOLEAN DEFAULT false;

-- Aggiorna le impostazioni esistenti con il valore di default
UPDATE png_export_settings 
SET use_player_avatars = false 
WHERE use_player_avatars IS NULL;

-- Verifica la migrazione
SELECT 
  id, 
  name, 
  use_player_avatars,
  jersey_numbers_color,
  jersey_numbers_shadow,
  field_lines_color,
  field_lines_thickness,
  name_box_color,
  name_text_color
FROM png_export_settings 
ORDER BY created_at DESC;