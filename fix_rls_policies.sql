-- Fix RLS policies for quick_trial_evaluations
-- The current policies are too restrictive for INSERT operations

-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view quick trial evaluations" ON public.quick_trial_evaluations;
DROP POLICY IF EXISTS "Team coaches can manage quick trial evaluations" ON public.quick_trial_evaluations;

-- Create more permissive policies for SELECT
CREATE POLICY "Team members can view quick trial evaluations" ON public.quick_trial_evaluations
  FOR SELECT USING (
    -- Direct team member check
    is_team_member(quick_trial_evaluations.team_id)
    OR EXISTS (
      SELECT 1 FROM public.trialists t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = quick_trial_evaluations.trialist_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.team_members tm ON tm.team_id = ts.team_id
      WHERE ts.id = quick_trial_evaluations.session_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );

-- Create separate policies for INSERT/UPDATE/DELETE with simpler checks
CREATE POLICY "Team coaches can insert quick trial evaluations" ON public.quick_trial_evaluations
  FOR INSERT WITH CHECK (
    -- User is coach/admin of the team_id being inserted
    has_team_permission(team_id, 'manage_players')
    OR EXISTS (
      SELECT 1 FROM public.trialists t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = trialist_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('admin','coach')
    )
  );

CREATE POLICY "Team coaches can update quick trial evaluations" ON public.quick_trial_evaluations
  FOR UPDATE USING (
    has_team_permission(team_id, 'manage_players')
    OR EXISTS (
      SELECT 1 FROM public.trialists t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = trialist_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('admin','coach')
    )
  ) WITH CHECK (
    has_team_permission(team_id, 'manage_players')
    OR EXISTS (
      SELECT 1 FROM public.trialists t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = trialist_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('admin','coach')
    )
  );

CREATE POLICY "Team coaches can delete quick trial evaluations" ON public.quick_trial_evaluations
  FOR DELETE USING (
    has_team_permission(team_id, 'manage_players')
    OR EXISTS (
      SELECT 1 FROM public.trialists t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE t.id = trialist_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('admin','coach')
    )
  );