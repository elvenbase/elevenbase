-- Create quick_trial_evaluations table for rapid evaluations during training sessions
CREATE TABLE public.quick_trial_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trialist_id UUID NOT NULL REFERENCES public.trialists(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Rating multipli per sessione (array di rating: -1, 0, 1)
  personality_ratings INTEGER[] DEFAULT '{}',
  ability_ratings INTEGER[] DEFAULT '{}', 
  flexibility_ratings INTEGER[] DEFAULT '{}',
  
  -- Decisione finale
  final_decision trial_status DEFAULT 'in_prova',
  
  -- Note cumulative
  notes TEXT,
  evaluator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_trial_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view quick trial evaluations" ON public.quick_trial_evaluations FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage quick trial evaluations" ON public.quick_trial_evaluations FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_quick_trial_evaluations_trialist_id ON public.quick_trial_evaluations(trialist_id);
CREATE INDEX idx_quick_trial_evaluations_session_id ON public.quick_trial_evaluations(session_id);
CREATE INDEX idx_quick_trial_evaluations_date ON public.quick_trial_evaluations(evaluation_date); 