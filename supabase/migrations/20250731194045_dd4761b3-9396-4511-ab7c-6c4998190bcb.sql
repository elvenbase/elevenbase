-- Add phone field to players table
ALTER TABLE public.players ADD COLUMN phone TEXT;

-- Create match_attendance table for tracking player attendance at matches
CREATE TABLE public.match_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late'
  arrival_time TIME WITHOUT TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Enable RLS on match_attendance
ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for match_attendance
CREATE POLICY "Coaches and admins can manage match attendance" 
ON public.match_attendance 
FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Everyone can view match attendance" 
ON public.match_attendance 
FOR SELECT 
USING (true);

-- Add index for better performance
CREATE INDEX idx_match_attendance_match_id ON public.match_attendance(match_id);
CREATE INDEX idx_match_attendance_player_id ON public.match_attendance(player_id);