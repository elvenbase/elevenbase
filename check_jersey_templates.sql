-- ============================================================================
-- VERIFICA STATO TABELLA JERSEY_TEMPLATES
-- ============================================================================

-- 1. Verifica se la tabella esiste
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'jersey_templates'
) as table_exists;

-- 2. Se esiste, mostra la struttura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'jersey_templates'
ORDER BY ordinal_position;

-- 3. Se esiste, mostra i dati
SELECT 
  id, 
  name, 
  description,
  image_url,
  is_default,
  created_by,
  png_field_lines_color,
  png_jersey_numbers_color,
  png_name_box_color,
  png_name_text_color,
  created_at
FROM jersey_templates 
ORDER BY created_at DESC;