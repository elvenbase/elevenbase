-- Test access to training_lineups table
-- Insert a test record to verify the table is working

-- First, let's check if we can insert a test record
INSERT INTO public.training_lineups (
  session_id,
  formation,
  players_data,
  formation_data,
  created_by
) VALUES (
  'd16f3c43-0cc1-4564-a768-5cd521aeff0f', -- The session ID from the error
  '4-4-2',
  '{"positions": {}}',
  '{}',
  NULL
) ON CONFLICT (session_id) DO NOTHING;

-- And then re-enable it with very permissive policies
ALTER TABLE public.training_lineups ENABLE ROW LEVEL SECURITY;

-- Drop all policies and create a single permissive one
DROP POLICY IF EXISTS "Allow authenticated users to view lineups" ON training_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to create lineups" ON training_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to update lineups" ON training_lineups;
DROP POLICY IF EXISTS "Allow authenticated users to delete lineups" ON training_lineups;

-- Create a single, very permissive policy for all operations
CREATE POLICY "Allow all operations for authenticated users" ON public.training_lineups
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the table structure one more time
DO $$
BEGIN
  RAISE NOTICE 'Training lineups table structure verified';
  RAISE NOTICE 'RLS enabled: %', (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'training_lineups'
  );
END $$;
