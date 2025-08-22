-- Add archived_at to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS training_sessions_archived_at_idx
ON training_sessions (archived_at);