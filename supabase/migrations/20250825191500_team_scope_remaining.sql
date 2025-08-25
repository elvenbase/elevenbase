-- Team-scope remaining tables and fix RLS policies
-- Date: 2025-08-25

-- 1) training_lineups: add team_id (via session join), enforce team-based RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_lineups') THEN
    -- Add team_id if missing (nullable to avoid breaking inserts); backfill from training_sessions
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'training_lineups' AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.training_lineups ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_training_lineups_team ON public.training_lineups(team_id);
      -- Backfill
      UPDATE public.training_lineups tl
      SET team_id = ts.team_id
      FROM public.training_sessions ts
      WHERE ts.id = tl.session_id AND tl.team_id IS NULL;
    END IF;

    ALTER TABLE public.training_lineups ENABLE ROW LEVEL SECURITY;

    -- Replace permissive policies with team-based ones
    DROP POLICY IF EXISTS "Allow authenticated users to view lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Allow authenticated users to create lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Allow authenticated users to update lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Allow authenticated users to delete lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Users can view training lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Users can create training lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Users can update training lineups" ON public.training_lineups;
    DROP POLICY IF EXISTS "Users can delete training lineups" ON public.training_lineups;

    CREATE POLICY "Team members can view training lineups" ON public.training_lineups
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = training_lineups.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage training lineups" ON public.training_lineups
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = training_lineups.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = training_lineups.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 2) match_lineups: ensure team-scoped RLS (derive team via matches)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_lineups') THEN
    -- Add team_id if missing; backfill from matches
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'match_lineups' AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.match_lineups ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_match_lineups_team ON public.match_lineups(team_id);
      UPDATE public.match_lineups ml
      SET team_id = m.team_id
      FROM public.matches m
      WHERE m.id = ml.match_id AND ml.team_id IS NULL;
    END IF;

    ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Team members can view match lineups" ON public.match_lineups;
    DROP POLICY IF EXISTS "Team coaches can manage match lineups" ON public.match_lineups;

    CREATE POLICY "Team members can view match lineups" ON public.match_lineups
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_lineups.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage match lineups" ON public.match_lineups
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_lineups.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_lineups.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 3) match_bench: team-scoped via matches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_bench') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'match_bench' AND column_name = 'team_id'
    ) THEN
      ALTER TABLE public.match_bench ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_match_bench_team ON public.match_bench(team_id);
      UPDATE public.match_bench mb
      SET team_id = m.team_id
      FROM public.matches m
      WHERE m.id = mb.match_id AND mb.team_id IS NULL;
    END IF;

    ALTER TABLE public.match_bench ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Team members can view match bench" ON public.match_bench;
    DROP POLICY IF EXISTS "Team coaches can manage match bench" ON public.match_bench;

    CREATE POLICY "Team members can view match bench" ON public.match_bench
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_bench.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage match bench" ON public.match_bench
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_bench.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_bench.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 4) match_events: enable RLS and team-based policies via matches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_events') THEN
    ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Team members can view match events" ON public.match_events;
    DROP POLICY IF EXISTS "Team coaches can manage match events" ON public.match_events;

    CREATE POLICY "Team members can view match events" ON public.match_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_events.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage match events" ON public.match_events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_events.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_events.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 5) match_attendance: replace global policies with team-based via matches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_attendance') THEN
    ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Coaches and admins can manage match attendance" ON public.match_attendance;
    DROP POLICY IF EXISTS "Everyone can view match attendance" ON public.match_attendance;

    CREATE POLICY "Team members can view match attendance" ON public.match_attendance
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_attendance.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage match attendance" ON public.match_attendance
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_attendance.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 6) match_player_stats: enable RLS and add team-based policies via matches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_player_stats') THEN
    ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Team members can view match player stats" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Team coaches can manage match player stats" ON public.match_player_stats;

    CREATE POLICY "Team members can view match player stats" ON public.match_player_stats
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_player_stats.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage match player stats" ON public.match_player_stats
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.team_members tm ON tm.team_id = m.team_id
          WHERE m.id = match_player_stats.match_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 7) player_statistics: team-based via players.team_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_statistics') THEN
    ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
    -- Drop old global policies if present
    DROP POLICY IF EXISTS "Everyone can view player statistics" ON public.player_statistics;
    DROP POLICY IF EXISTS "Coaches and admins can manage player statistics" ON public.player_statistics;

    CREATE POLICY "Team members can view player statistics" ON public.player_statistics
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.players p
          JOIN public.team_members tm ON tm.team_id = p.team_id
          WHERE p.id = player_statistics.player_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage player statistics" ON public.player_statistics
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.players p
          JOIN public.team_members tm ON tm.team_id = p.team_id
          WHERE p.id = player_statistics.player_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 8) quick_trial_evaluations: team-based via team_id OR trialists/session join
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quick_trial_evaluations') THEN
    ALTER TABLE public.quick_trial_evaluations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Everyone can view quick trial evaluations" ON public.quick_trial_evaluations;
    DROP POLICY IF EXISTS "Coaches and admins can manage quick trial evaluations" ON public.quick_trial_evaluations;

    CREATE POLICY "Team members can view quick trial evaluations" ON public.quick_trial_evaluations
      FOR SELECT USING (
        (quick_trial_evaluations.team_id IS NOT NULL AND is_team_member(quick_trial_evaluations.team_id))
        OR EXISTS (
          SELECT 1 FROM public.trialists t
          JOIN public.team_members tm ON tm.team_id = t.team_id
          WHERE t.id = quick_trial_evaluations.trialist_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = quick_trial_evaluations.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage quick trial evaluations" ON public.quick_trial_evaluations
      FOR ALL USING (
        (quick_trial_evaluations.team_id IS NOT NULL AND has_team_permission(quick_trial_evaluations.team_id, 'manage_players'))
        OR EXISTS (
          SELECT 1 FROM public.trialists t
          JOIN public.team_members tm ON tm.team_id = t.team_id
          WHERE t.id = quick_trial_evaluations.trialist_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
        OR EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = quick_trial_evaluations.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        (quick_trial_evaluations.team_id IS NOT NULL AND has_team_permission(quick_trial_evaluations.team_id, 'manage_players'))
        OR EXISTS (
          SELECT 1 FROM public.trialists t
          JOIN public.team_members tm ON tm.team_id = t.team_id
          WHERE t.id = quick_trial_evaluations.trialist_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
        OR EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = quick_trial_evaluations.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 9) player_evaluations: team-based via team_id OR players join
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_evaluations') THEN
    ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Everyone can view player evaluations" ON public.player_evaluations;
    DROP POLICY IF EXISTS "Coaches and admins can manage player evaluations" ON public.player_evaluations;

    CREATE POLICY "Team members can view player evaluations" ON public.player_evaluations
      FOR SELECT USING (
        (player_evaluations.team_id IS NOT NULL AND is_team_member(player_evaluations.team_id))
        OR EXISTS (
          SELECT 1 FROM public.players p
          JOIN public.team_members tm ON tm.team_id = p.team_id
          WHERE p.id = player_evaluations.player_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage player evaluations" ON public.player_evaluations
      FOR ALL USING (
        (player_evaluations.team_id IS NOT NULL AND has_team_permission(player_evaluations.team_id, 'manage_players'))
        OR EXISTS (
          SELECT 1 FROM public.players p
          JOIN public.team_members tm ON tm.team_id = p.team_id
          WHERE p.id = player_evaluations.player_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      ) WITH CHECK (
        (player_evaluations.team_id IS NOT NULL AND has_team_permission(player_evaluations.team_id, 'manage_players'))
        OR EXISTS (
          SELECT 1 FROM public.players p
          JOIN public.team_members tm ON tm.team_id = p.team_id
          WHERE p.id = player_evaluations.player_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

-- 10) training_convocati: team-based via training_sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_convocati') THEN
    ALTER TABLE public.training_convocati ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view convocati for sessions they have access to" ON public.training_convocati;
    DROP POLICY IF EXISTS "Users can insert convocati for sessions they created" ON public.training_convocati;
    DROP POLICY IF EXISTS "Users can update convocati for sessions they created" ON public.training_convocati;
    DROP POLICY IF EXISTS "Users can delete convocati for sessions they created" ON public.training_convocati;
    DROP POLICY IF EXISTS "Allow public read of convocati for sessions with public token" ON public.training_convocati;

    CREATE POLICY "Team members can view training convocati" ON public.training_convocati
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = training_convocati.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
        )
      );

    CREATE POLICY "Team coaches can manage training convocati" ON public.training_convocati
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.training_sessions ts
          JOIN public.team_members tm ON tm.team_id = ts.team_id
          WHERE ts.id = training_convocati.session_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('admin','coach')
        )
      );
  END IF;
END $$;

