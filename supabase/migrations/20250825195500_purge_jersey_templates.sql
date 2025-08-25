-- Purge all jersey templates (including previous defaults)
-- Date: 2025-08-25

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jersey_templates') THEN
    DELETE FROM public.jersey_templates;
  END IF;
END $$;

