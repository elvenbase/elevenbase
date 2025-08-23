-- Add missing columns to training_sessions table
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS allow_responses_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_is_closed ON training_sessions(is_closed);
CREATE INDEX IF NOT EXISTS idx_training_sessions_allow_responses_until ON training_sessions(allow_responses_until);

-- Create function to calculate response deadline (4 hours before start)
CREATE OR REPLACE FUNCTION public.calculate_response_deadline(session_date DATE, start_time TIME)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  session_datetime TIMESTAMP WITH TIME ZONE;
  deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Combine date and time
  session_datetime := (session_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE;
  
  -- Subtract 4 hours
  deadline := session_datetime - INTERVAL '4 hours';
  
  RETURN deadline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set allow_responses_until
CREATE OR REPLACE FUNCTION public.handle_training_session_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.allow_responses_until IS NULL AND NEW.session_date IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.allow_responses_until = public.calculate_response_deadline(NEW.session_date, NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_training_session_deadline ON training_sessions;
CREATE TRIGGER trigger_training_session_deadline
  BEFORE INSERT OR UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_training_session_deadline();

-- Add comments for documentation
COMMENT ON COLUMN training_sessions.is_closed IS 'Whether the training session is manually closed';
COMMENT ON COLUMN training_sessions.allow_responses_until IS 'Deadline for player responses (4 hours before session start)';

