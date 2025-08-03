-- Create app_settings table for application-wide settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_public ON app_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_app_settings_created_by ON app_settings(created_by);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy 1: Authenticated users can view public settings
DROP POLICY IF EXISTS "Authenticated users can view public app settings" ON app_settings;
CREATE POLICY "Authenticated users can view public app settings" ON app_settings
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_public = true);

-- Policy 2: Admins can view all settings
DROP POLICY IF EXISTS "Admins can view all app settings" ON app_settings;
CREATE POLICY "Admins can view all app settings" ON app_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_name = 'admin'
    )
  );

-- Policy 3: Admins can insert settings
DROP POLICY IF EXISTS "Admins can insert app settings" ON app_settings;
CREATE POLICY "Admins can insert app settings" ON app_settings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_name = 'admin'
    )
  );

-- Policy 4: Admins can update settings
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
CREATE POLICY "Admins can update app settings" ON app_settings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_name = 'admin'
    )
  );

-- Policy 5: Admins can delete settings
DROP POLICY IF EXISTS "Admins can delete app settings" ON app_settings;
CREATE POLICY "Admins can delete app settings" ON app_settings
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_name = 'admin'
    )
  );

-- Create function to upsert app settings
CREATE OR REPLACE FUNCTION upsert_app_setting(
  p_setting_key TEXT,
  p_setting_value TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT FALSE
)
RETURNS app_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result app_settings;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can modify app settings';
  END IF;

  -- Upsert the setting
  INSERT INTO app_settings (
    setting_key, 
    setting_value, 
    description, 
    is_public, 
    created_by, 
    updated_by
  )
  VALUES (
    p_setting_key, 
    p_setting_value, 
    p_description, 
    p_is_public, 
    auth.uid(), 
    auth.uid()
  )
  ON CONFLICT (setting_key) 
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW(),
    updated_by = auth.uid()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Insert default WhatsApp group setting
INSERT INTO app_settings (setting_key, setting_value, description, is_public, created_by, updated_by)
VALUES (
  'whatsapp_group_code',
  '',
  'Codice del gruppo WhatsApp per gli inviti automatici',
  true,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (setting_key) DO NOTHING;