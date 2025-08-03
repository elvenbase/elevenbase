-- Enable RLS for png_export_settings table and create appropriate policies

-- Enable Row Level Security
ALTER TABLE png_export_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for png_export_settings

-- Policy 1: Users can view their own settings
DROP POLICY IF EXISTS "Users can view their own png export settings" ON png_export_settings;
CREATE POLICY "Users can view their own png export settings" ON png_export_settings
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

-- Policy 2: Public can view default settings
DROP POLICY IF EXISTS "Public can view default png export settings" ON png_export_settings;
CREATE POLICY "Public can view default png export settings" ON png_export_settings
  FOR SELECT USING (is_default = true);

-- Policy 3: Users can insert their own settings
DROP POLICY IF EXISTS "Users can insert their own png export settings" ON png_export_settings;
CREATE POLICY "Users can insert their own png export settings" ON png_export_settings
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- Policy 4: Users can update their own settings
DROP POLICY IF EXISTS "Users can update their own png export settings" ON png_export_settings;
CREATE POLICY "Users can update their own png export settings" ON png_export_settings
  FOR UPDATE USING (auth.uid()::text = created_by);

-- Policy 5: Users can delete their own settings
DROP POLICY IF EXISTS "Users can delete their own png export settings" ON png_export_settings;
CREATE POLICY "Users can delete their own png export settings" ON png_export_settings
  FOR DELETE USING (auth.uid()::text = created_by);