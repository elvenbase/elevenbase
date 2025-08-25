-- Unify RLS across match-related tables using helper functions

-- 1) Helpers: can_view_team, can_manage_team
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.can_view_team(_team_id uuid, _user_id uuid DEFAULT auth.uid())
  RETURNS boolean AS $$
  BEGIN
    RETURN public.is_team_member(_team_id, _user_id) OR public.has_role(_user_id, 'superadmin');
  END; $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION public.can_manage_team(_team_id uuid, _user_id uuid DEFAULT auth.uid())
  RETURNS boolean AS $$
  DECLARE v_owner uuid;
  BEGIN
    SELECT owner_id INTO v_owner FROM public.teams WHERE id=_team_id;
    RETURN public.has_team_permission(_team_id, 'manage_matches', _user_id)
           OR v_owner = _user_id
           OR public.has_role(_user_id, 'superadmin');
  END; $$ LANGUAGE plpgsql SECURITY DEFINER;
END $$;

-- 2) match_attendance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_attendance') THEN
    ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Team members can view match attendance" ON public.match_attendance;
    DROP POLICY IF EXISTS "Team coaches can manage match attendance" ON public.match_attendance;
    CREATE POLICY "View match_attendance by team" ON public.match_attendance
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_attendance.match_id AND public.can_view_team(m.team_id)
        )
      );
    CREATE POLICY "Manage match_attendance by team" ON public.match_attendance
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_attendance.match_id AND public.can_manage_team(m.team_id)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_attendance.match_id AND public.can_manage_team(m.team_id)
        )
      );
  END IF;
END $$;

-- 3) match_bench
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_bench') THEN
    ALTER TABLE public.match_bench ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "View match_bench" ON public.match_bench;
    DROP POLICY IF EXISTS "Manage match_bench" ON public.match_bench;
    CREATE POLICY "View match_bench by team" ON public.match_bench
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_bench.match_id AND public.can_view_team(m.team_id)
        )
      );
    CREATE POLICY "Manage match_bench by team" ON public.match_bench
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_bench.match_id AND public.can_manage_team(m.team_id)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_bench.match_id AND public.can_manage_team(m.team_id)
        )
      );
  END IF;
END $$;

-- 4) match_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_events') THEN
    ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "View match_events" ON public.match_events;
    DROP POLICY IF EXISTS "Manage match_events" ON public.match_events;
    CREATE POLICY "View match_events by team" ON public.match_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_events.match_id AND public.can_view_team(m.team_id)
        )
      );
    CREATE POLICY "Manage match_events by team" ON public.match_events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_events.match_id AND public.can_manage_team(m.team_id)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_events.match_id AND public.can_manage_team(m.team_id)
        )
      );
  END IF;
END $$;

-- 5) match_player_stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_player_stats') THEN
    ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "View match_player_stats" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Manage match_player_stats" ON public.match_player_stats;
    CREATE POLICY "View match_player_stats by team" ON public.match_player_stats
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_player_stats.match_id AND public.can_view_team(m.team_id)
        )
      );
    CREATE POLICY "Manage match_player_stats by team" ON public.match_player_stats
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_player_stats.match_id AND public.can_manage_team(m.team_id)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_player_stats.match_id AND public.can_manage_team(m.team_id)
        )
      );
  END IF;
END $$;

-- 6) match_lineups
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='match_lineups') THEN
    ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "View match_lineups" ON public.match_lineups;
    DROP POLICY IF EXISTS "Manage match_lineups" ON public.match_lineups;
    CREATE POLICY "View match_lineups by team" ON public.match_lineups
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_lineups.match_id AND public.can_view_team(m.team_id)
        )
      );
    CREATE POLICY "Manage match_lineups by team" ON public.match_lineups
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_lineups.match_id AND public.can_manage_team(m.team_id)
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          WHERE m.id = match_lineups.match_id AND public.can_manage_team(m.team_id)
        )
      );
  END IF;
END $$;

