-- Attendance Score settings: per-award MVP toggle
ALTER TABLE IF EXISTS attendance_score_settings
  ADD COLUMN IF NOT EXISTS mvp_bonus_per_award boolean NOT NULL DEFAULT false;