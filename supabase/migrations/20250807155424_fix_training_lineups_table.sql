-- Fix training_lineups table structure and permissions
-- Drop existing table if it has issues and recreate it properly

-- First, drop the table if it exists (this will also drop all policies)
DROP TABLE IF EXISTS public.training_lineups CASCADE;

-- Recreate the table with proper structure
CREATE TABLE public.training_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  formation TEXT NOT NULL,
  players_data JSONB NOT NULL DEFAULT '{"positions": {}}',
  formation_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(session_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_lineups_session_id ON training_lineups(session_id);
CREATE INDEX IF NOT EXISTS idx_training_lineups_created_by ON training_lineups(created_by);
CREATE INDEX IF NOT EXISTS idx_training_lineups_formation ON training_lineups(formation);

-- Enable RLS
ALTER TABLE public.training_lineups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can create training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can update training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can delete training lineups" ON training_lineups;

-- Create proper RLS policies
CREATE POLICY "Users can view training lineups" ON public.training_lineups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create training lineups" ON public.training_lineups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update training lineups" ON public.training_lineups
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can delete training lineups" ON public.training_lineups
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.training_lineups IS 'Lineups for training sessions';
COMMENT ON COLUMN training_lineups.players_data IS 'JSON object with position_id -> player_id mappings';
COMMENT ON COLUMN training_lineups.formation_data IS 'JSON object with formation customization settings';
COMMENT ON COLUMN training_lineups.created_by IS 'User who created the lineup';
