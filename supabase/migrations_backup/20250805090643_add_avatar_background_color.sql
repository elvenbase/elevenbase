-- Add avatar_background_color column to existing png_export_settings table
ALTER TABLE public.png_export_settings 
ADD COLUMN avatar_background_color TEXT DEFAULT '#1a2332';

-- Update existing default settings to include the new column
UPDATE public.png_export_settings 
SET avatar_background_color = '#1a2332' 
WHERE avatar_background_color IS NULL;