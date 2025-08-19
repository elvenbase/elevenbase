-- Remove 'excused' from allowed statuses in training_attendance.status
ALTER TABLE public.training_attendance 
DROP CONSTRAINT IF EXISTS training_attendance_status_check;

ALTER TABLE public.training_attendance 
ADD CONSTRAINT training_attendance_status_check 
CHECK (status IN ('pending', 'present', 'absent', 'late', 'no_response'));

COMMENT ON COLUMN public.training_attendance.status IS 
'Status auto-risposta: pending (in attesa), present (presente), absent (assente), late (in ritardo), no_response (nessuna risposta entro la deadline)';
