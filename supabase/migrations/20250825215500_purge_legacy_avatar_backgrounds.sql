-- Purge non-default rows from legacy avatar_backgrounds table (idempotent)
-- Keeps only rows flagged as system defaults (created_by IS NULL AND is_default = true)
-- If the table does not exist, this script will no-op when applied manually.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='avatar_backgrounds'
  ) THEN
    DELETE FROM public.avatar_backgrounds
    WHERE NOT (created_by IS NULL AND is_default = true);
  END IF;
END $$;

