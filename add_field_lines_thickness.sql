-- ============================================================================
-- MIGRATION: Aggiungi spessore linee campo
-- ============================================================================
-- Aggiunge il campo field_lines_thickness alla tabella png_export_settings
-- ============================================================================

-- Aggiungi colonna per lo spessore delle linee del campo
ALTER TABLE png_export_settings 
ADD COLUMN IF NOT EXISTS field_lines_thickness INTEGER DEFAULT 2;

-- Aggiorna le impostazioni esistenti con il valore di default
UPDATE png_export_settings 
SET field_lines_thickness = 2 
WHERE field_lines_thickness IS NULL;

-- Verifica la migrazione
SELECT 
  id, 
  name, 
  field_lines_thickness,
  field_lines_color,
  jersey_numbers_color,
  name_box_color,
  name_text_color
FROM png_export_settings 
ORDER BY created_at DESC;