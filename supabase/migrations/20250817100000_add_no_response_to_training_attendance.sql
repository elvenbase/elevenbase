-- Add 'no_response' as valid status for training_attendance.status (auto-response only)
ALTER TABLE public.training_attendance 
DROP CONSTRAINT IF EXISTS training_attendance_status_check;

ALTER TABLE public.training_attendance 
ADD CONSTRAINT training_attendance_status_check 
CHECK (status IN ('pending', 'present', 'absent', 'late', 'excused', 'no_response'));

COMMENT ON COLUMN public.training_attendance.status IS 
'Status auto-risposta: pending (in attesa), present (presente), absent (assente), late (in ritardo), excused (giustificato), no_response (nessuna risposta entro la deadline)';