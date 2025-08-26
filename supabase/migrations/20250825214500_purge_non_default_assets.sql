-- Purge non-default jersey templates and avatar assets (idempotent)
-- Keeps only system defaults (created_by IS NULL AND is_default = true)
-- and leaves team/personal data intact if desired. As per request, remove all
-- non-default rows globally.

-- Jerseys: delete all rows where NOT (created_by IS NULL AND is_default = true)
DELETE FROM public.jersey_templates
WHERE NOT (created_by IS NULL AND is_default = true);

-- Avatar assets: delete all rows where NOT (created_by IS NULL AND is_default = true)
-- This will remove personal/team customizations as well; aligns with request to
-- keep only the global defaults configured.
DELETE FROM public.avatar_assets
WHERE NOT (created_by IS NULL AND is_default = true);

