-- Add self_registered to trialist invites tables to support public self-registration
ALTER TABLE public.training_trialist_invites
  ADD COLUMN IF NOT EXISTS self_registered boolean NOT NULL DEFAULT false;

ALTER TABLE public.match_trialist_invites
  ADD COLUMN IF NOT EXISTS self_registered boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.training_trialist_invites.self_registered IS 'True se il record è stato creato tramite auto-registrazione pubblica';
COMMENT ON COLUMN public.match_trialist_invites.self_registered IS 'True se il record è stato creato tramite auto-registrazione pubblica';