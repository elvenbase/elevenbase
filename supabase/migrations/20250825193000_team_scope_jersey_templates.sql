-- Team-scope jersey_templates: add team_id, indexes, RLS policies
-- Date: 2025-08-25

DO $$
BEGIN
  -- Add team_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'jersey_templates' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.jersey_templates
      ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;

  -- Index for performance
  CREATE INDEX IF NOT EXISTS idx_jersey_templates_team ON public.jersey_templates(team_id);

  -- Enable RLS
  ALTER TABLE public.jersey_templates ENABLE ROW LEVEL SECURITY;

  -- Drop old policies
  DROP POLICY IF EXISTS "Jersey templates are viewable by authenticated users" ON public.jersey_templates;
  DROP POLICY IF EXISTS "Jersey templates can be created by authenticated users" ON public.jersey_templates;
  DROP POLICY IF EXISTS "Jersey templates can be updated by their creators" ON public.jersey_templates;
  DROP POLICY IF EXISTS "Jersey templates can be deleted by their creators" ON public.jersey_templates;

  -- View: team members can view team jerseys; also allow global system default (created_by IS NULL AND is_default)
  CREATE POLICY "Team members can view team jerseys or system default" ON public.jersey_templates
    FOR SELECT USING (
      (team_id IS NOT NULL AND is_team_member(team_id))
      OR (team_id IS NULL AND created_by IS NULL AND is_default = true)
    );

  -- Insert/Update/Delete: team admins or founder can manage team jerseys
  CREATE POLICY "Team admins can manage team jerseys" ON public.jersey_templates
    FOR ALL USING (
      team_id IS NOT NULL AND (
        has_team_permission(team_id, 'manage_team') OR
        (SELECT owner_id FROM public.teams t WHERE t.id = jersey_templates.team_id) = auth.uid()
      )
    ) WITH CHECK (
      team_id IS NOT NULL AND (
        has_team_permission(team_id, 'manage_team') OR
        (SELECT owner_id FROM public.teams t WHERE t.id = jersey_templates.team_id) = auth.uid()
      )
    );
END $$;

