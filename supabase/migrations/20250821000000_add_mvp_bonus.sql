-- Add MVP fields: awards count on scores, and configurable bonus in settings
alter table if exists attendance_scores
  add column if not exists mvp_awards integer not null default 0;

alter table if exists attendance_score_settings
  add column if not exists mvp_bonus_once numeric not null default 5.0;

