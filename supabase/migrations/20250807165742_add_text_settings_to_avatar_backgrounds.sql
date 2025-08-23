-- Add text settings columns to avatar_backgrounds table
ALTER TABLE public.avatar_backgrounds ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';
ALTER TABLE public.avatar_backgrounds ADD COLUMN IF NOT EXISTS text_shadow TEXT DEFAULT '2px 2px 4px rgba(0,0,0,0.8)';
ALTER TABLE public.avatar_backgrounds ADD COLUMN IF NOT EXISTS text_size TEXT DEFAULT '14px';
ALTER TABLE public.avatar_backgrounds ADD COLUMN IF NOT EXISTS text_weight TEXT DEFAULT '600';
ALTER TABLE public.avatar_backgrounds ADD COLUMN IF NOT EXISTS text_family TEXT DEFAULT 'Inter, system-ui, sans-serif';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_avatar_backgrounds_text_color ON avatar_backgrounds(text_color);
CREATE INDEX IF NOT EXISTS idx_avatar_backgrounds_text_size ON avatar_backgrounds(text_size);

-- Add comments for documentation
COMMENT ON COLUMN avatar_backgrounds.text_color IS 'Color for text displayed on this background';
COMMENT ON COLUMN avatar_backgrounds.text_shadow IS 'CSS text-shadow for text displayed on this background';
COMMENT ON COLUMN avatar_backgrounds.text_size IS 'Font size for text displayed on this background';
COMMENT ON COLUMN avatar_backgrounds.text_weight IS 'Font weight for text displayed on this background';
COMMENT ON COLUMN avatar_backgrounds.text_family IS 'Font family for text displayed on this background';

-- Update existing records with default text settings
UPDATE avatar_backgrounds SET 
  text_color = '#ffffff',
  text_shadow = '2px 2px 4px rgba(0,0,0,0.8)',
  text_size = '14px',
  text_weight = '600',
  text_family = 'Inter, system-ui, sans-serif'
WHERE text_color IS NULL;

