-- Ensure avatar_assets table exists with team_id and proper RLS
-- Date: 2025-08-25

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'avatar_assets'
  ) THEN
    CREATE TABLE public.avatar_assets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('color','image')),
      value TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_avatar_assets_created_by ON public.avatar_assets(created_by);
    CREATE INDEX IF NOT EXISTS idx_avatar_assets_team ON public.avatar_assets(team_id);

    -- Optional: seed from avatar_backgrounds if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'avatar_backgrounds'
    ) THEN
      INSERT INTO public.avatar_assets (name, type, value, is_default, created_at, updated_at, created_by)
      SELECT name, type, value, is_default, created_at, updated_at, created_by FROM public.avatar_backgrounds
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Enable RLS and (re)create policies idempotently
  ALTER TABLE public.avatar_assets ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "View avatar assets (team, personal, system default)" ON public.avatar_assets;
  CREATE POLICY "View avatar assets (team, personal, system default)" ON public.avatar_assets
    FOR SELECT USING (
      (team_id IS NOT NULL AND is_team_member(team_id)) OR
      (created_by = auth.uid()) OR
      (team_id IS NULL AND created_by IS NULL AND is_default = true)
    );

  DROP POLICY IF EXISTS "Manage team avatar assets" ON public.avatar_assets;
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

  DROP POLICY IF EXISTS "Manage personal avatar assets" ON public.avatar_assets;
  CREATE POLICY "Manage personal avatar assets" ON public.avatar_assets
    FOR ALL USING (
      created_by = auth.uid() AND team_id IS NULL
    ) WITH CHECK (
      created_by = auth.uid() AND team_id IS NULL
    );
END $$;

