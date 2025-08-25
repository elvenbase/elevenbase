-- Fix match_attendance RLS: add WITH CHECK for inserts/updates and allow team founder
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='match_attendance'
  ) THEN
    ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to replace them idempotently
    DROP POLICY IF EXISTS "Team members can view match attendance" ON public.match_attendance;
    DROP POLICY IF EXISTS "Team coaches can manage match attendance" ON public.match_attendance;

    -- View policy: active team members of the match's team
    CREATE POLICY "Team members can view match attendance" ON public.match_attendance
      FOR SELECT USING (
        EXISTS (
          SELECT 1 
          FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_attendance.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    -- Manage policy: team coaches/admins or team founder (owner)
    CREATE POLICY "Team coaches can manage match attendance" ON public.match_attendance
      FOR ALL USING (
        EXISTS (
          SELECT 1
          FROM public.matches m
          LEFT JOIN public.team_members tm ON tm.team_id = m.team_id AND tm.user_id = auth.uid()
          LEFT JOIN public.teams t ON t.id = m.team_id
          WHERE m.id = match_attendance.match_id
          AND (
            (tm.status = 'active' AND tm.role IN ('admin','coach'))
            OR t.owner_id = auth.uid()
          )
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.matches m
          LEFT JOIN public.team_members tm ON tm.team_id = m.team_id AND tm.user_id = auth.uid()
          LEFT JOIN public.teams t ON t.id = m.team_id
          WHERE m.id = match_attendance.match_id
          AND (
            (tm.status = 'active' AND tm.role IN ('admin','coach'))
            OR t.owner_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

