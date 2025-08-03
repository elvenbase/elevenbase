-- ============================================================================
-- MIGRATION: Rimuovi campi PNG da jersey_templates
-- ============================================================================
-- Rimuove i campi PNG dalla tabella jersey_templates per usare la tabella dedicata
-- ============================================================================

-- Rimuovi le colonne PNG dalla tabella jersey_templates
ALTER TABLE jersey_templates 
DROP COLUMN IF EXISTS png_field_lines_color,
DROP COLUMN IF EXISTS png_jersey_numbers_color,
DROP COLUMN IF EXISTS png_name_box_color,
DROP COLUMN IF EXISTS png_name_text_color;

-- Verifica che le colonne siano state rimosse
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'jersey_templates'
ORDER BY ordinal_position;