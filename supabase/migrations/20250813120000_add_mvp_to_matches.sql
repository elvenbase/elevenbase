-- Add MVP columns to matches: either player or trialist
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS mvp_player_id uuid NULL,
ADD COLUMN IF NOT EXISTS mvp_trialist_id uuid NULL,
ADD CONSTRAINT matches_mvp_check CHECK (
	(mvp_player_id IS NULL) <> (mvp_trialist_id IS NULL)
);

-- FKs (DEFERRABLE to avoid constraint issues during updates)
ALTER TABLE public.matches
	ADD CONSTRAINT matches_mvp_player_fk FOREIGN KEY (mvp_player_id) REFERENCES public.players(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE public.matches
	ADD CONSTRAINT matches_mvp_trialist_fk FOREIGN KEY (mvp_trialist_id) REFERENCES public.trialists(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- Optional: index to query MVP quickly
CREATE INDEX IF NOT EXISTS idx_matches_mvp_player ON public.matches(mvp_player_id);
CREATE INDEX IF NOT EXISTS idx_matches_mvp_trialist ON public.matches(mvp_trialist_id);