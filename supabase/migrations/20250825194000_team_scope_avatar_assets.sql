-- Team-scope avatar_assets: add team_id and RLS; support team fallback and user personal
-- Date: 2025-08-25

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'avatar_assets') THEN
    -- Add team_id column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'avatar_assets' AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.avatar_assets
        ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_avatar_assets_team ON public.avatar_assets(team_id);
    CREATE INDEX IF NOT EXISTS idx_avatar_assets_created_by ON public.avatar_assets(created_by);

    ALTER TABLE public.avatar_assets ENABLE ROW LEVEL SECURITY;

    -- Drop potential previous permissive policies (if any)
    DROP POLICY IF EXISTS "Users can view their own avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Public can view default avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Users can insert their own avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Users can update their own avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Users can delete their own avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Team members can view team avatar assets" ON public.avatar_assets;
    DROP POLICY IF EXISTS "Team admins can manage team avatar assets" ON public.avatar_assets;

    -- View policy: team members see team avatars; users see their own; everyone sees system default (global fallback)
    CREATE POLICY "View avatar assets (team, personal, system default)" ON public.avatar_assets
      FOR SELECT USING (
        (team_id IS NOT NULL AND is_team_member(team_id)) OR
        (created_by = auth.uid()) OR
        (team_id IS NULL AND created_by IS NULL AND is_default = true)
      );

    -- Manage team avatars: team admins/founders
    CREATE POLICY "Manage team avatar assets" ON public.avatar_assets
      FOR ALL USING (
        team_id IS NOT NULL AND (
          has_team_permission(team_id, 'manage_team') OR
          (SELECT owner_id FROM public.teams t WHERE t.id = avatar_assets.team_id) = auth.uid()
        )
      ) WITH CHECK (
        team_id IS NOT NULL AND (
          has_team_permission(team_id, 'manage_team') OR
          (SELECT owner_id FROM public.teams t WHERE t.id = avatar_assets.team_id) = auth.uid()
        )
      );

    -- Manage personal avatars: owner only
    CREATE POLICY "Manage personal avatar assets" ON public.avatar_assets
      FOR ALL USING (
        created_by = auth.uid() AND team_id IS NULL
      ) WITH CHECK (
        created_by = auth.uid() AND team_id IS NULL
      );
  END IF;
END $$;

