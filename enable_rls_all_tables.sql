-- Enable RLS for all user-specific tables and create appropriate policies

-- ===== PNG EXPORT SETTINGS =====
-- Enable Row Level Security
ALTER TABLE png_export_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for png_export_settings
DROP POLICY IF EXISTS "Users can view their own png export settings" ON png_export_settings;
CREATE POLICY "Users can view their own png export settings" ON png_export_settings
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Public can view default png export settings" ON png_export_settings;
CREATE POLICY "Public can view default png export settings" ON png_export_settings
  FOR SELECT USING (is_default = true);

DROP POLICY IF EXISTS "Users can insert their own png export settings" ON png_export_settings;
CREATE POLICY "Users can insert their own png export settings" ON png_export_settings
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update their own png export settings" ON png_export_settings;
CREATE POLICY "Users can update their own png export settings" ON png_export_settings
  FOR UPDATE USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete their own png export settings" ON png_export_settings;
CREATE POLICY "Users can delete their own png export settings" ON png_export_settings
  FOR DELETE USING (auth.uid()::text = created_by);

-- ===== JERSEY TEMPLATES =====
-- Enable Row Level Security
ALTER TABLE jersey_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for jersey_templates
DROP POLICY IF EXISTS "Users can view their own jersey templates" ON jersey_templates;
CREATE POLICY "Users can view their own jersey templates" ON jersey_templates
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Public can view default jersey templates" ON jersey_templates;
CREATE POLICY "Public can view default jersey templates" ON jersey_templates
  FOR SELECT USING (is_default = true);

DROP POLICY IF EXISTS "Users can insert their own jersey templates" ON jersey_templates;
CREATE POLICY "Users can insert their own jersey templates" ON jersey_templates
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update their own jersey templates" ON jersey_templates;
CREATE POLICY "Users can update their own jersey templates" ON jersey_templates
  FOR UPDATE USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete their own jersey templates" ON jersey_templates;
CREATE POLICY "Users can delete their own jersey templates" ON jersey_templates
  FOR DELETE USING (auth.uid()::text = created_by);

-- ===== CUSTOM FORMATIONS =====
-- Enable Row Level Security
ALTER TABLE custom_formations ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_formations
DROP POLICY IF EXISTS "Users can view their own custom formations" ON custom_formations;
CREATE POLICY "Users can view their own custom formations" ON custom_formations
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Users can insert their own custom formations" ON custom_formations;
CREATE POLICY "Users can insert their own custom formations" ON custom_formations
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can update their own custom formations" ON custom_formations;
CREATE POLICY "Users can update their own custom formations" ON custom_formations
  FOR UPDATE USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Users can delete their own custom formations" ON custom_formations;
CREATE POLICY "Users can delete their own custom formations" ON custom_formations
  FOR DELETE USING (auth.uid()::text = created_by);