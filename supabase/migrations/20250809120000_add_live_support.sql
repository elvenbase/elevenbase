-- Matches live fields
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS allow_trialists boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_state text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS clock_started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS clock_offset_seconds integer NOT NULL DEFAULT 0;

-- Optional: constrain live_state to known values (commented if not desired)
-- ALTER TABLE public.matches
--   ADD CONSTRAINT matches_live_state_chk CHECK (live_state IN ('not_started','first_half','half_time','second_half','extra_time','ended'));

-- Match events extended fields
ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS minute integer,
  ADD COLUMN IF NOT EXISTS period text,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS trialist_id uuid NULL REFERENCES public.trialists(id) ON DELETE SET NULL;

-- Index to query events by match and created time
CREATE INDEX IF NOT EXISTS match_events_match_id_created_at_idx ON public.match_events (match_id, created_at);

-- Player stats per match
CREATE TABLE IF NOT EXISTS public.match_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NULL REFERENCES public.players(id) ON DELETE SET NULL,
  trialist_id uuid NULL REFERENCES public.trialists(id) ON DELETE SET NULL,
  started boolean NOT NULL DEFAULT false,
  minutes integer NOT NULL DEFAULT 0,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  yellow_cards integer NOT NULL DEFAULT 0,
  red_cards integer NOT NULL DEFAULT 0,
  fouls_committed integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  sub_in_minute integer NULL,
  sub_out_minute integer NULL,
  was_in_squad boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_player_stats_oneof_chk CHECK (
    (player_id IS NOT NULL AND trialist_id IS NULL) OR (player_id IS NULL AND trialist_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS match_player_stats_match_idx ON public.match_player_stats (match_id);
CREATE INDEX IF NOT EXISTS match_player_stats_player_idx ON public.match_player_stats (player_id);
CREATE INDEX IF NOT EXISTS match_player_stats_trialist_idx ON public.match_player_stats (trialist_id);
CREATE UNIQUE INDEX IF NOT EXISTS match_player_stats_unique_per_entity ON public.match_player_stats (match_id, COALESCE(player_id::text, trialist_id::text));

-- RLS (optional: allow only service/admin roles)
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;