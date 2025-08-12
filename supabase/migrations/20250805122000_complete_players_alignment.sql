-- Allineamento completo: aggiungi campi mancanti alla tabella players

-- 1. Aggiungi created_by per audit trail
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Aggiungi esperienza per continuità dati
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS esperienza TEXT;

-- 3. Aggiungi notes per annotazioni
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Commenti per documentazione
COMMENT ON COLUMN public.players.created_by IS 'Utente che ha creato il record del giocatore (audit trail)';
COMMENT ON COLUMN public.players.esperienza IS 'Esperienza sportiva del giocatore (identico a trialists per trasferimento dati)';
COMMENT ON COLUMN public.players.notes IS 'Note generiche sul giocatore (identico a trialists per annotazioni)';

-- Indici per performance e ricerche
CREATE INDEX IF NOT EXISTS idx_players_created_by ON public.players(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_esperienza ON public.players(esperienza) WHERE esperienza IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_notes ON public.players(notes) WHERE notes IS NOT NULL;