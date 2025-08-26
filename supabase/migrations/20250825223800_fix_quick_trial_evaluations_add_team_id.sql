-- Fix: Add team_id column to quick_trial_evaluations if missing
-- This migration ensures team_id exists for RLS policies to work correctly

DO $$
BEGIN
    -- Add team_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quick_trial_evaluations' 
        AND column_name = 'team_id'
    ) THEN
        ALTER TABLE public.quick_trial_evaluations 
        ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added team_id column to quick_trial_evaluations';
    ELSE
        RAISE NOTICE 'team_id column already exists in quick_trial_evaluations';
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'quick_trial_evaluations' 
        AND indexname = 'idx_quick_trial_evaluations_team'
    ) THEN
        CREATE INDEX idx_quick_trial_evaluations_team ON public.quick_trial_evaluations(team_id);
        RAISE NOTICE 'Created index idx_quick_trial_evaluations_team';
    ELSE
        RAISE NOTICE 'Index idx_quick_trial_evaluations_team already exists';
    END IF;

    -- Update existing records to set team_id from trialists
    -- This is needed if there are existing records without team_id
    UPDATE public.quick_trial_evaluations 
    SET team_id = t.team_id
    FROM public.trialists t
    WHERE quick_trial_evaluations.trialist_id = t.id
    AND quick_trial_evaluations.team_id IS NULL;

    RAISE NOTICE 'Updated existing quick_trial_evaluations records with team_id from trialists';
END $$;