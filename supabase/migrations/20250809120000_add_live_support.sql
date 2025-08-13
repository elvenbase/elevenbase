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