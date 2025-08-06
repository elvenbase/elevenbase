-- Create training_convocati table
CREATE TABLE IF NOT EXISTS training_convocati (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of session and player
  UNIQUE(session_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_convocati_session_id ON training_convocati(session_id);
CREATE INDEX IF NOT EXISTS idx_training_convocati_player_id ON training_convocati(player_id);
CREATE INDEX IF NOT EXISTS idx_training_convocati_confirmed ON training_convocati(confirmed);

-- Enable RLS
ALTER TABLE training_convocati ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view convocati for sessions they have access to" ON training_convocati
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_convocati.session_id
      AND (
        ts.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'superadmin')
        )
      )
    )
  );

CREATE POLICY "Users can insert convocati for sessions they created" ON training_convocati
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_convocati.session_id
      AND ts.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update convocati for sessions they have access to" ON training_convocati
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_convocati.session_id
      AND (
        ts.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'superadmin')
        )
      )
    )
  );

CREATE POLICY "Users can delete convocati for sessions they created" ON training_convocati
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_convocati.session_id
      AND ts.created_by = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_convocati_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_training_convocati_updated_at
  BEFORE UPDATE ON training_convocati
  FOR EACH ROW
  EXECUTE FUNCTION update_training_convocati_updated_at();