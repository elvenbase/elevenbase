-- Abilitare l'estensione pgcrypto per gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificare che le funzioni esistano e funzionino correttamente
-- Test della funzione generate_public_token
SELECT public.generate_public_token() as test_token;

-- Test della funzione calculate_response_deadline
SELECT public.calculate_response_deadline('2025-08-01'::date, '20:00'::time) as test_deadline;