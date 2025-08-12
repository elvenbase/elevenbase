-- Aggiungi il campo phone alla tabella profiles
ALTER TABLE public.profiles 
ADD COLUMN phone text;

-- Aggiungi anche altri campi utili per i profili utente
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;