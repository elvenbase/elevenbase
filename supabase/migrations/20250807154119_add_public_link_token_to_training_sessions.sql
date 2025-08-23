-- Add public_link_token column to training_sessions table
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS public_link_token TEXT UNIQUE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_public_link_token ON training_sessions(public_link_token);

-- Create function to generate public tokens
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically generate public_link_token
CREATE OR REPLACE FUNCTION public.handle_training_session_public_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_link_token IS NULL THEN
    NEW.public_link_token = public.generate_public_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_training_session_public_token ON training_sessions;
CREATE TRIGGER trigger_training_session_public_token
  BEFORE INSERT ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_training_session_public_token();

-- Add comment for documentation
COMMENT ON COLUMN training_sessions.public_link_token IS 'Unique token for public access to training session';

