-- Aggiunge 'pending' come status valido per training_attendance
-- Questo permette agli allenatori di avere 3 opzioni: pending, present, absent

-- Rimuove il vecchio constraint
ALTER TABLE public.training_attendance 
DROP CONSTRAINT IF EXISTS training_attendance_status_check;

-- Aggiunge il nuovo constraint che include 'pending'
ALTER TABLE public.training_attendance 
ADD CONSTRAINT training_attendance_status_check 
CHECK (status IN ('pending', 'present', 'absent', 'late', 'excused'));

-- Aggiorna il commento sulla tabella per documentare il cambiamento
COMMENT ON COLUMN public.training_attendance.status IS 
'Status della presenza: pending (in attesa), present (presente), absent (assente), late (in ritardo), excused (giustificato)';