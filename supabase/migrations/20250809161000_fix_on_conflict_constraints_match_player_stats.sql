-- Ensure ON CONFLICT works for match_player_stats by using UNIQUE CONSTRAINTS instead of partial unique indexes
-- Safe to run multiple times

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'match_player_stats_unique_player') THEN
    DROP INDEX IF EXISTS public.match_player_stats_unique_player;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'match_player_stats_unique_trialist') THEN
    DROP INDEX IF EXISTS public.match_player_stats_unique_trialist;
  END IF;
END $$;

-- Create UNIQUE CONSTRAINTS (not partial) so ON CONFLICT (match_id, player_id) and (match_id, trialist_id) are valid
ALTER TABLE public.match_player_stats
  ADD CONSTRAINT match_player_stats_unique_player UNIQUE (match_id, player_id);

ALTER TABLE public.match_player_stats
  ADD CONSTRAINT match_player_stats_unique_trialist UNIQUE (match_id, trialist_id);