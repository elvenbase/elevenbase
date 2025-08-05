-- Aggiungi campo capitano alla tabella players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT false;

-- Crea indice per performance 
CREATE INDEX IF NOT EXISTS idx_players_is_captain ON public.players(is_captain);

-- Aggiungi constraint per assicurare un solo capitano
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_single_captain 
ON public.players(is_captain) 
WHERE is_captain = true;

-- Commenti per documentazione
COMMENT ON COLUMN public.players.is_captain IS 'Indica se il giocatore è il capitano della squadra (solo uno alla volta)';