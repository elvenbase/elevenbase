-- ============================================================================
-- MIGRATION: Aggiungi ombra numeri maglie
-- ============================================================================
-- Aggiunge il campo jersey_numbers_shadow alla tabella png_export_settings
-- ============================================================================

-- Aggiungi colonna per l'ombra dei numeri delle maglie
ALTER TABLE png_export_settings 
ADD COLUMN IF NOT EXISTS jersey_numbers_shadow VARCHAR(100) DEFAULT '2px 2px 4px rgba(0,0,0,0.9)';

-- Aggiorna le impostazioni esistenti con il valore di default
UPDATE png_export_settings 
SET jersey_numbers_shadow = '2px 2px 4px rgba(0,0,0,0.9)' 
WHERE jersey_numbers_shadow IS NULL;

-- Verifica la migrazione
SELECT 
  id, 
  name, 
  jersey_numbers_color,
  jersey_numbers_shadow,
  field_lines_color,
  field_lines_thickness,
  name_box_color,
  name_text_color
FROM png_export_settings 
ORDER BY created_at DESC;