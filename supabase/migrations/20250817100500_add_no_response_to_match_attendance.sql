-- Add 'no_response' as valid status for match_attendance.status (auto-response only)
ALTER TABLE public.match_attendance 
ALTER COLUMN status SET DEFAULT 'pending';

-- If you have a constraint, drop and recreate to include no_response
-- This project uses TEXT without enum, so add a CHECK if not exists
DO $$ BEGIN
  ALTER TABLE public.match_attendance 
    ADD CONSTRAINT match_attendance_status_check 
    CHECK (status IN ('pending','present','absent','no_response'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

COMMENT ON COLUMN public.match_attendance.status IS 
'Status auto-risposta: pending (in attesa), present (presente), absent (assente), no_response (nessuna risposta entro la deadline)';