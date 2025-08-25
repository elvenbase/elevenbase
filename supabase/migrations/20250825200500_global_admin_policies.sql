-- Allow a specific global admin via role to manage system-wide defaults
-- Role: superadmin
-- Date: 2025-08-25

-- Helper: use has_role(auth.uid(), 'superadmin') in policies

DO $$
BEGIN
  -- jersey_templates: allow superadmin to manage system (team_id IS NULL) rows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jersey_templates') THEN
    DROP POLICY IF EXISTS "Global admin can manage system jerseys" ON public.jersey_templates;

    CREATE POLICY "Global admin can manage system jerseys" ON public.jersey_templates
      FOR ALL USING (
        team_id IS NULL AND has_role(auth.uid(), 'superadmin')
      ) WITH CHECK (
        team_id IS NULL AND has_role(auth.uid(), 'superadmin')
      );
  END IF;

  -- avatar_assets: allow superadmin to manage system (team_id IS NULL AND created_by IS NULL) rows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'avatar_assets') THEN
    DROP POLICY IF EXISTS "Global admin can manage system avatar assets" ON public.avatar_assets;

    CREATE POLICY "Global admin can manage system avatar assets" ON public.avatar_assets
      FOR ALL USING (
        team_id IS NULL AND created_by IS NULL AND has_role(auth.uid(), 'superadmin')
      ) WITH CHECK (
        team_id IS NULL AND created_by IS NULL AND has_role(auth.uid(), 'superadmin')
      );
  END IF;
END $$;

