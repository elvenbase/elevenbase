-- Fix RLS policies for training_lineups table
-- Ensure the table is accessible to authenticated users

-- First, let's make sure RLS is enabled
ALTER TABLE public.training_lineups ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can create training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can update training lineups" ON training_lineups;
DROP POLICY IF EXISTS "Users can delete training lineups" ON training_lineups;

-- Create simple, permissive policies for now to debug the issue
-- Allow all authenticated users to read lineups
CREATE POLICY "Allow authenticated users to view lineups" ON public.training_lineups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to create lineups
CREATE POLICY "Allow authenticated users to create lineups" ON public.training_lineups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update lineups (temporarily permissive)
CREATE POLICY "Allow authenticated users to update lineups" ON public.training_lineups
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete lineups (temporarily permissive)
CREATE POLICY "Allow authenticated users to delete lineups" ON public.training_lineups
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the table structure
DO $$
BEGIN
  -- Check if all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_lineups' 
    AND column_name = 'formation_data'
  ) THEN
    RAISE EXCEPTION 'Column formation_data does not exist in training_lineups';
  END IF;
  
  -- Check if all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_lineups' 
    AND column_name = 'created_by'
  ) THEN
    RAISE EXCEPTION 'Column created_by does not exist in training_lineups';
  END IF;
  
  RAISE NOTICE 'All required columns exist in training_lineups table';
END $$;
