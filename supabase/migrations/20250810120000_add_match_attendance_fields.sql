-- Add fields to mirror training attendance logic for matches
ALTER TABLE public.match_attendance
  ADD COLUMN IF NOT EXISTS self_registered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_confirmation_status TEXT NOT NULL DEFAULT 'pending';

-- Set status default to 'pending' (keep existing values unchanged)
ALTER TABLE public.match_attendance
  ALTER COLUMN status SET DEFAULT 'pending';

-- Optional: constrain status values (commented out if enums are not used)
-- CREATE TYPE attendance_status AS ENUM ('pending','present','absent');
-- ALTER TABLE public.match_attendance ALTER COLUMN status TYPE TEXT;
-- ALTER TABLE public.match_attendance ALTER COLUMN coach_confirmation_status TYPE TEXT;

-- Indexes for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_match_attendance_status ON public.match_attendance(status);
CREATE INDEX IF NOT EXISTS idx_match_attendance_coach_status ON public.match_attendance(coach_confirmation_status);