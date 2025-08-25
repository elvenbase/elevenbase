-- Team scoping for admin-related tables (png_export_settings, field_options, custom_formations, attendance_score_settings)
-- Adds team_id, indexes, and RLS policies using multi-team helpers

-- 1) png_export_settings: add team_id and policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'png_export_settings' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.png_export_settings
      ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_png_export_settings_team ON public.png_export_settings(team_id);

-- Policies: team members can view; team admins (or owner) can manage
DROP POLICY IF EXISTS "Users can view their own png export settings" ON public.png_export_settings;
DROP POLICY IF EXISTS "Public can view default png export settings" ON public.png_export_settings;
DROP POLICY IF EXISTS "Users can insert their own png export settings" ON public.png_export_settings;
DROP POLICY IF EXISTS "Users can update their own png export settings" ON public.png_export_settings;
DROP POLICY IF EXISTS "Users can delete their own png export settings" ON public.png_export_settings;

ALTER TABLE public.png_export_settings ENABLE ROW LEVEL SECURITY;

-- View: default global OR same team
CREATE POLICY "View png settings by team or default" ON public.png_export_settings
  FOR SELECT USING (
    is_default = true OR (team_id IS NOT NULL AND is_team_member(team_id))
  );

-- Insert/Update/Delete: require team manage permission
CREATE POLICY "Manage png settings by team" ON public.png_export_settings
  FOR ALL USING (
    team_id IS NOT NULL AND (has_team_permission(team_id, 'manage_team') OR (SELECT owner_id FROM public.teams t WHERE t.id = team_id) = auth.uid())
  ) WITH CHECK (
    team_id IS NOT NULL AND (has_team_permission(team_id, 'manage_team') OR (SELECT owner_id FROM public.teams t WHERE t.id = team_id) = auth.uid())
  );

-- 2) field_options: add team_id and policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'field_options' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.field_options
      ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_field_options_team ON public.field_options(team_id);

ALTER TABLE public.field_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage field options" ON public.field_options;

CREATE POLICY "View field options by team" ON public.field_options
  FOR SELECT USING (
    team_id IS NOT NULL AND is_team_member(team_id)
  );

CREATE POLICY "Manage field options by team" ON public.field_options
  FOR ALL USING (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  ) WITH CHECK (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  );

-- 3) custom_formations: add team_id and policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'custom_formations' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.custom_formations
      ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_custom_formations_team ON public.custom_formations(team_id);

ALTER TABLE public.custom_formations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches and admins can manage custom formations" ON public.custom_formations;
DROP POLICY IF EXISTS "Everyone can view custom formations" ON public.custom_formations;

CREATE POLICY "View formations by team" ON public.custom_formations
  FOR SELECT USING (
    team_id IS NOT NULL AND is_team_member(team_id)
  );

CREATE POLICY "Manage formations by team" ON public.custom_formations
  FOR ALL USING (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  ) WITH CHECK (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  );

-- 4) attendance_score_settings: add team_id and policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_score_settings' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.attendance_score_settings
      ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_attendance_score_settings_team ON public.attendance_score_settings(team_id);

ALTER TABLE public.attendance_score_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage attendance score settings" ON public.attendance_score_settings;

CREATE POLICY "View attendance settings by team" ON public.attendance_score_settings
  FOR SELECT USING (
    team_id IS NOT NULL AND is_team_member(team_id)
  );

CREATE POLICY "Manage attendance settings by team" ON public.attendance_score_settings
  FOR ALL USING (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  ) WITH CHECK (
    team_id IS NOT NULL AND has_team_permission(team_id, 'manage_team')
  );

