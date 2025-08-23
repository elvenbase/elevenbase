-- Create png_export_settings table
CREATE TABLE IF NOT EXISTS public.png_export_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default',
  field_lines_color TEXT DEFAULT '#ffffff',
  field_lines_thickness INTEGER DEFAULT 2,
  jersey_numbers_color TEXT DEFAULT '#000000',
  jersey_numbers_shadow TEXT DEFAULT '2px 2px 4px rgba(0,0,0,0.9)',
  use_player_avatars BOOLEAN DEFAULT false,
  name_box_color TEXT DEFAULT '#ffffff',
  name_text_color TEXT DEFAULT '#000000',
  avatar_background_color TEXT DEFAULT '#1a2332',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_png_export_settings_is_default ON png_export_settings(is_default);
CREATE INDEX IF NOT EXISTS idx_png_export_settings_created_by ON png_export_settings(created_by);

-- Insert default settings
INSERT INTO public.png_export_settings (name, is_default, created_by) 
VALUES ('Default', true, NULL)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE public.png_export_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading settings (all authenticated users can read)
CREATE POLICY "Users can view png export settings" ON public.png_export_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting settings (only authenticated users)
CREATE POLICY "Users can create png export settings" ON public.png_export_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating settings (only owner or admin)
CREATE POLICY "Users can update their own png export settings" ON public.png_export_settings
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Policy for deleting settings (only owner or admin)
CREATE POLICY "Users can delete their own png export settings" ON public.png_export_settings
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.png_export_settings IS 'Settings for PNG export of formations';

