-- Relax MVP check: allow both NULL, forbid both set
ALTER TABLE public.matches
	DROP CONSTRAINT IF EXISTS matches_mvp_check;

ALTER TABLE public.matches
	ADD CONSTRAINT matches_mvp_one_or_zero_check CHECK (
		mvp_player_id IS NULL OR mvp_trialist_id IS NULL
	);