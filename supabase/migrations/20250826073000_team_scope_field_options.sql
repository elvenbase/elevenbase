-- Team-scope: field_options
-- Adds team_id column and index if missing

ALTER TABLE public.field_options
  ADD COLUMN IF NOT EXISTS team_id uuid;

CREATE INDEX IF NOT EXISTS field_options_team_id_idx
  ON public.field_options(team_id);