-- Aggiungi campo conferma coach alla tabella training_attendance
ALTER TABLE public.training_attendance 
ADD COLUMN IF NOT EXISTS coach_confirmation_status TEXT DEFAULT 'pending' 
CHECK (coach_confirmation_status IN ('pending', 'present', 'absent', 'late', 'excused'));

-- Commento per documentazione
COMMENT ON COLUMN public.training_attendance.coach_confirmation_status IS 'Status confermato dal coach durante la sessione di allenamento (separato dall auto-registrazione)';
COMMENT ON COLUMN public.training_attendance.status IS 'Status auto-registrazione giocatore o impostato dal coach';
COMMENT ON COLUMN public.training_attendance.self_registered IS 'Indica se il record è stato creato tramite auto-registrazione giocatore';