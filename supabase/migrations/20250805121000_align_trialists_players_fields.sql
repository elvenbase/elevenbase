-- Allineamento campi tra tabelle players e trialists

-- 1. Aggiungi is_captain alla tabella trialists
ALTER TABLE public.trialists 
ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT false;

-- 2. Aggiungi birth_date e email alla tabella players  
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Commenti per documentazione
COMMENT ON COLUMN public.trialists.is_captain IS 'Indica se il trialist è stato designato come capitano durante la prova';
COMMENT ON COLUMN public.players.birth_date IS 'Data di nascita del giocatore per calcoli statistiche età';
COMMENT ON COLUMN public.players.email IS 'Email di contatto del giocatore per comunicazioni ufficiali';

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_trialists_is_captain ON public.trialists(is_captain) WHERE is_captain = true;
CREATE INDEX IF NOT EXISTS idx_players_birth_date ON public.players(birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email) WHERE email IS NOT NULL;