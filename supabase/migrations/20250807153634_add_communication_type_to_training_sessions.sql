-- Add communication_type column to training_sessions table
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS communication_type TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_communication_type ON training_sessions(communication_type);

-- Add comment for documentation
COMMENT ON COLUMN training_sessions.communication_type IS 'Type of communication for the training session (e.g., email, whatsapp, sms)';

