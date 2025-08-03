-- ============================================================================
-- MIGRATION: Aggiungi campi per colori PNG di default
-- ============================================================================
-- Aggiunge campi per personalizzare i colori PNG nelle maglie di default
-- ============================================================================

-- Aggiungi colonne per i colori PNG di default
ALTER TABLE jersey_templates 
ADD COLUMN IF NOT EXISTS png_field_lines_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS png_jersey_numbers_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS png_name_box_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS png_name_text_color VARCHAR(7) DEFAULT '#000000';

-- Aggiorna la maglia di default esistente con i colori di default
UPDATE jersey_templates 
SET 
  png_field_lines_color = '#ffffff',
  png_jersey_numbers_color = '#000000',
  png_name_box_color = '#ffffff',
  png_name_text_color = '#000000'
WHERE is_default = true AND created_by IS NULL;

-- Verifica la migrazione
SELECT 
  id, 
  name, 
  png_field_lines_color,
  png_jersey_numbers_color,
  png_name_box_color,
  png_name_text_color
FROM jersey_templates 
WHERE is_default = true;