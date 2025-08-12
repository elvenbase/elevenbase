-- Modifica la tabella profiles per rendere l'id generato automaticamente se non fornito
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();