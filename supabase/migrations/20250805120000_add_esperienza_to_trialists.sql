-- Aggiunge campo esperienza alla tabella trialists
ALTER TABLE public.trialists 
ADD COLUMN IF NOT EXISTS esperienza TEXT;

COMMENT ON COLUMN public.trialists.esperienza IS 'Campo di testo libero per descrivere l esperienza sportiva del trialist';

-- Crea indice per ricerche testuali sull'esperienza
CREATE INDEX IF NOT EXISTS idx_trialists_esperienza ON public.trialists(esperienza) WHERE esperienza IS NOT NULL;