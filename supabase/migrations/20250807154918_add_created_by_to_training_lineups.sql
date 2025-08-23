-- Add created_by column to existing training_lineups table
ALTER TABLE public.training_lineups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_training_lineups_created_by ON training_lineups(created_by);

-- Add comment for documentation
COMMENT ON COLUMN training_lineups.created_by IS 'User who created the lineup';

