-- Create enums
CREATE TYPE public.player_status AS ENUM ('active', 'inactive', 'injured', 'suspended');
CREATE TYPE public.competition_type AS ENUM ('championship', 'tournament', 'friendly');
CREATE TYPE public.match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE public.trial_status AS ENUM ('in_prova', 'promosso', 'archiviato');

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INTEGER UNIQUE,
  position TEXT,
  status player_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  max_participants INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_attendance table
CREATE TABLE public.training_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  arrival_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

-- Create competitions table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type competition_type NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  location TEXT,
  home_away TEXT CHECK (home_away IN ('home', 'away')),
  status match_status NOT NULL DEFAULT 'scheduled',
  our_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trialists table
CREATE TABLE public.trialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  position TEXT,
  status trial_status NOT NULL DEFAULT 'in_prova',
  trial_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trial_evaluations table
CREATE TABLE public.trial_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trialist_id UUID NOT NULL REFERENCES public.trialists(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  technical_score INTEGER CHECK (technical_score >= 1 AND technical_score <= 5),
  physical_score INTEGER CHECK (physical_score >= 1 AND physical_score <= 5),
  tactical_score INTEGER CHECK (tactical_score >= 1 AND tactical_score <= 5),
  attitude_score INTEGER CHECK (attitude_score >= 1 AND attitude_score <= 5),
  overall_rating DECIMAL(2,1),
  notes TEXT,
  evaluator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_statistics table
CREATE TABLE public.player_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season TEXT,
  matches_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  training_attendance_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, season)
);

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Everyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert players" ON public.players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Superadmins and admins can update players" ON public.players FOR UPDATE USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Superadmins can delete players" ON public.players FOR DELETE USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for training_sessions
CREATE POLICY "Everyone can view training sessions" ON public.training_sessions FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage training sessions" ON public.training_sessions FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for training_attendance
CREATE POLICY "Everyone can view training attendance" ON public.training_attendance FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage training attendance" ON public.training_attendance FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for competitions
CREATE POLICY "Everyone can view competitions" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage competitions" ON public.competitions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for matches
CREATE POLICY "Everyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for trialists
CREATE POLICY "Everyone can view trialists" ON public.trialists FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage trialists" ON public.trialists FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for trial_evaluations
CREATE POLICY "Everyone can view trial evaluations" ON public.trial_evaluations FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage trial evaluations" ON public.trial_evaluations FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for player_statistics
CREATE POLICY "Everyone can view player statistics" ON public.player_statistics FOR SELECT USING (true);
CREATE POLICY "Coaches and admins can manage player statistics" ON public.player_statistics FOR ALL USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trialists_updated_at BEFORE UPDATE ON public.trialists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON public.player_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing players data
INSERT INTO public.players (first_name, last_name, status) VALUES
('Alessio', 'Argenti', 'active'),
('Alessio', 'Iervolino', 'active'),
('Matteo', 'Medile', 'active'),
('Marco', 'Pitingolo', 'active'),
('Alessandro', 'Contu', 'active'),
('Marco', 'Azzi', 'active'),
('Jacopo', 'D''Astolto', 'active'),
('Andrea', 'Camolese', 'active'),
('Giacomo', 'Caggiano', 'active'),
('Mario', 'Bervicato', 'active'),
('Luigi', 'Russo', 'active'),
('Vito', 'Tessitore', 'active'),
('Raffaele', 'Lanzaro', 'active'),
('Riccardo', 'Perna', 'active'),
('Nicola', 'Leuci', 'active'),
('Nathan', 'Habib', 'active'),
('Matteo', 'Cascone', 'active'),
('Lucio', 'De Crescenzo', 'active'),
('Gianmichele', 'Cossu', 'active'),
('Daniele', 'Moscato', 'active'),
('Andrea', 'Argenti', 'active'),
('Alessandro', 'Rossi', 'active'),
('Maurizio', 'Liguori', 'active');