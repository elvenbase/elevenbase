-- Create player_evaluations table for storing evaluations of promoted players
CREATE TABLE public.player_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  
  -- Original trialist data
  original_trialist_id UUID, -- Reference to original trialist (for tracking)
  
  -- Evaluation data transferred from quick_trial_evaluations
  evaluation_date DATE NOT NULL,
  personality_ratings INTEGER[] DEFAULT '{}',
  ability_ratings INTEGER[] DEFAULT '{}',
  flexibility_ratings INTEGER[] DEFAULT '{}',
  final_decision trial_status DEFAULT 'promosso',
  notes TEXT,
  
  -- Metadata
  evaluator_id UUID REFERENCES auth.users(id),
  transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view player evaluations" ON public.player_evaluations FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage player evaluations" ON public.player_evaluations FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_player_evaluations_player_id ON public.player_evaluations(player_id);
CREATE INDEX idx_player_evaluations_original_trialist_id ON public.player_evaluations(original_trialist_id);
CREATE INDEX idx_player_evaluations_date ON public.player_evaluations(evaluation_date);