-- Add communication_details column to training_sessions table
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS communication_details TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_communication_details ON training_sessions(communication_details);

-- Add comment for documentation
COMMENT ON COLUMN training_sessions.communication_details IS 'Additional communication details for the training session';

