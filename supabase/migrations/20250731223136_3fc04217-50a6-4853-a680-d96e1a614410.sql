-- Prima abilitare l'estensione pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ricreare la funzione generate_public_token con la corretta estensione
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usare gen_random_uuid() invece di gen_random_bytes per compatibilità
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$$;

-- Test della funzione aggiornata
SELECT public.generate_public_token() as test_token;