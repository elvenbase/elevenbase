-- Attendance Scores: store daily computed reliability/discipline score per player
create table if not exists attendance_scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  score_date date not null,
  points_raw numeric not null default 0,
  score_0_100 numeric not null default 0,
  opportunities integer not null default 0,
  t_p integer not null default 0,
  t_l integer not null default 0,
  t_a integer not null default 0,
  t_nr integer not null default 0,
  m_p integer not null default 0,
  m_l integer not null default 0,
  m_a integer not null default 0,
  m_nr integer not null default 0,
  no_response_rate numeric not null default 0,
  match_presence_rate numeric not null default 0,
  match_late_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, score_date)
);

create index if not exists idx_attendance_scores_date on attendance_scores(score_date);
create index if not exists idx_attendance_scores_player on attendance_scores(player_id);

alter table attendance_scores enable row level security;

-- RLS: players are not directly readable; staff/admin can read
drop policy if exists "staff can read attendance_scores" on attendance_scores;
create policy "staff can read attendance_scores" on attendance_scores
  for select using (
    auth.uid() is not null
  );

drop policy if exists "staff can insert attendance_scores" on attendance_scores;
create policy "staff can insert attendance_scores" on attendance_scores
  for insert with check (auth.uid() is not null);

drop policy if exists "staff can update attendance_scores" on attendance_scores;
create policy "staff can update attendance_scores" on attendance_scores
  for update using (auth.uid() is not null);

-- Settings for weights
create table if not exists attendance_score_settings (
  id uuid primary key default gen_random_uuid(),
  preset text not null default 'simple',
  training_present_on_time numeric not null default 1.0,
  training_present_late numeric not null default 0.6,
  training_absent numeric not null default -0.8,
  training_no_response numeric not null default -1.0,
  match_present_on_time numeric not null default 2.5,
  match_present_late numeric not null default 1.5,
  match_absent numeric not null default -2.0,
  match_no_response numeric not null default -2.5,
  min_events integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table attendance_score_settings enable row level security;
drop policy if exists "admins manage attendance_score_settings" on attendance_score_settings;
create policy "admins manage attendance_score_settings" on attendance_score_settings
  for all using (
    auth.uid() is not null
  ) with check (
    auth.uid() is not null
  );

