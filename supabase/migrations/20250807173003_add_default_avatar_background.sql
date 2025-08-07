-- Add a default avatar background for testing
INSERT INTO public.avatar_backgrounds (
  name,
  type,
  value,
  text_color,
  text_shadow,
  text_size,
  text_weight,
  text_family,
  is_default,
  created_by
) VALUES (
  'Blu Squadra',
  'color',
  '#1e40af',
  '#ffffff',
  '2px 2px 4px rgba(0,0,0,0.8)',
  '16px',
  '700',
  'Inter, system-ui, sans-serif',
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- Ensure only one default background exists
UPDATE avatar_backgrounds 
SET is_default = false 
WHERE id NOT IN (
  SELECT id FROM avatar_backgrounds 
  WHERE is_default = true 
  ORDER BY created_at ASC 
  LIMIT 1
);
