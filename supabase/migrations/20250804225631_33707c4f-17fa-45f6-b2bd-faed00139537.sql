
-- Assicuriamoci che tutte le tabelle necessarie esistano e abbiano le strutture corrette
-- Verifichiamo e aggiorniamo la tabella training_convocati
CREATE TABLE IF NOT EXISTS public.training_convocati (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  player_id UUID NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assicuriamoci che le colonne gaming esistano nella tabella players
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'ea_sport_id') THEN
    ALTER TABLE public.players ADD COLUMN ea_sport_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'gaming_platform') THEN
    ALTER TABLE public.players ADD COLUMN gaming_platform VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'platform_id') THEN
    ALTER TABLE public.players ADD COLUMN platform_id VARCHAR(255);
  END IF;
END $$;

-- Aggiorna il trigger per training_convocati se non esiste
CREATE OR REPLACE FUNCTION update_training_convocati_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_convocati_updated_at_trigger ON public.training_convocati;
CREATE TRIGGER update_training_convocati_updated_at_trigger
    BEFORE UPDATE ON public.training_convocati
    FOR EACH ROW
    EXECUTE FUNCTION update_training_convocati_updated_at();

-- Abilita RLS su training_convocati se non già abilitato
ALTER TABLE public.training_convocati ENABLE ROW LEVEL SECURITY;

-- Aggiungi le policy RLS per training_convocati se non esistono
DROP POLICY IF EXISTS "Users can view convocati for sessions they have access to" ON public.training_convocati;
CREATE POLICY "Users can view convocati for sessions they have access to" ON public.training_convocati
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts 
      WHERE ts.id = training_convocati.session_id 
      AND (
        ts.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'coach')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert convocati for sessions they created" ON public.training_convocati;
CREATE POLICY "Users can insert convocati for sessions they created" ON public.training_convocati
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions ts 
      WHERE ts.id = training_convocati.session_id 
      AND ts.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update convocati for sessions they created" ON public.training_convocati;
CREATE POLICY "Users can update convocati for sessions they created" ON public.training_convocati
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts 
      WHERE ts.id = training_convocati.session_id 
      AND ts.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete convocati for sessions they created" ON public.training_convocati;
CREATE POLICY "Users can delete convocati for sessions they created" ON public.training_convocati
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts 
      WHERE ts.id = training_convocati.session_id 
      AND ts.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow public read of convocati for sessions with public token" ON public.training_convocati;
CREATE POLICY "Allow public read of convocati for sessions with public token" ON public.training_convocati
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts 
      WHERE ts.id = training_convocati.session_id 
      AND ts.public_link_token IS NOT NULL
    )
  );
