-- Estendere tabella training_sessions con nuovi campi
ALTER TABLE public.training_sessions 
ADD COLUMN is_closed boolean DEFAULT false,
ADD COLUMN public_link_token text UNIQUE,
ADD COLUMN allow_responses_until timestamp with time zone;

-- Estendere tabella training_attendance con nuovi campi  
ALTER TABLE public.training_attendance
ADD COLUMN self_registered boolean DEFAULT false,
ADD COLUMN registration_time timestamp with time zone DEFAULT now();

-- Creare tabella training_lineups per gestire formazioni
CREATE TABLE public.training_lineups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  formation text NOT NULL, -- es. "4-4-2", "3-5-2", "4-3-3"
  players_data jsonb, -- struttura: {"positions": [{"position": "GK", "player_id": "uuid", "x": 50, "y": 10}]}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Abilitare RLS per training_lineups
ALTER TABLE public.training_lineups ENABLE ROW LEVEL SECURITY;

-- Politiche RLS per training_lineups
CREATE POLICY "Coaches and admins can manage training lineups" 
ON public.training_lineups 
FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Everyone can view training lineups" 
ON public.training_lineups 
FOR SELECT 
USING (true);

-- Trigger per aggiornare updated_at su training_lineups
CREATE TRIGGER update_training_lineups_updated_at
BEFORE UPDATE ON public.training_lineups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Funzione per generare token pubblico unico
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare allow_responses_until (4 ore prima dell'inizio)
CREATE OR REPLACE FUNCTION public.calculate_response_deadline(session_date date, start_time time)
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN (session_date + start_time - interval '4 hours');
END;
$$ LANGUAGE plpgsql;

-- Trigger per generare automaticamente token e deadline quando si crea una sessione
CREATE OR REPLACE FUNCTION public.handle_training_session_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Genera token pubblico unico
  NEW.public_link_token = public.generate_public_token();
  
  -- Calcola deadline per le risposte (4 ore prima dell'inizio)
  NEW.allow_responses_until = public.calculate_response_deadline(NEW.session_date, NEW.start_time);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_session_insert_trigger
BEFORE INSERT ON public.training_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_training_session_insert();