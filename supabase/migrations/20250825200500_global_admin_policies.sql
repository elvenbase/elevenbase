-- Allow a specific global admin (by email) to manage system-wide defaults
-- Email: coach@elevenbase.pro
-- Date: 2025-08-25

-- Helper expression to read email from JWT:
-- (current_setting('request.jwt.claims', true)::json ->> 'email')

DO $$
BEGIN
  -- jersey_templates: allow global admin to manage system (team_id IS NULL) rows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jersey_templates') THEN
    -- Drop previous policy if rerun
    DROP POLICY IF EXISTS "Global admin can manage system jerseys" ON public.jersey_templates;

    CREATE POLICY "Global admin can manage system jerseys" ON public.jersey_templates
      FOR ALL USING (
        team_id IS NULL AND (
          (current_setting('request.jwt.claims', true)::json ->> 'email') = 'coach@elevenbase.pro'
        )
      ) WITH CHECK (
        team_id IS NULL AND (
          (current_setting('request.jwt.claims', true)::json ->> 'email') = 'coach@elevenbase.pro'
        )
      );
  END IF;

  -- avatar_assets: allow global admin to manage system (team_id IS NULL AND created_by IS NULL) rows
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'avatar_assets') THEN
    DROP POLICY IF EXISTS "Global admin can manage system avatar assets" ON public.avatar_assets;

    CREATE POLICY "Global admin can manage system avatar assets" ON public.avatar_assets
      FOR ALL USING (
        team_id IS NULL AND created_by IS NULL AND (
          (current_setting('request.jwt.claims', true)::json ->> 'email') = 'coach@elevenbase.pro'
        )
      ) WITH CHECK (
        team_id IS NULL AND created_by IS NULL AND (
          (current_setting('request.jwt.claims', true)::json ->> 'email') = 'coach@elevenbase.pro'
        )
      );
  END IF;
END $$;

