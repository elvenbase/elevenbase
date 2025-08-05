-- Create png_export_settings table for PNG export customization
CREATE TABLE public.png_export_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  field_lines_color TEXT DEFAULT '#ffffff',
  field_lines_thickness INTEGER DEFAULT 2,
  jersey_numbers_color TEXT DEFAULT '#000000',
  jersey_numbers_shadow TEXT DEFAULT '2px 2px 4px rgba(0,0,0,0.9)',
  use_player_avatars BOOLEAN DEFAULT false,
  name_box_color TEXT DEFAULT '#ffffff',
  name_text_color TEXT DEFAULT '#000000',
  avatar_background_color TEXT DEFAULT '#1a2332',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.png_export_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for png_export_settings
CREATE POLICY "Everyone can view PNG export settings" 
ON public.png_export_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Coaches and admins can manage PNG export settings" 
ON public.png_export_settings 
FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_png_export_settings_updated_at
BEFORE UPDATE ON public.png_export_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default PNG export settings
INSERT INTO public.png_export_settings (
  name, 
  description,
  field_lines_color,
  field_lines_thickness,
  jersey_numbers_color,
  jersey_numbers_shadow,
  use_player_avatars,
  name_box_color,
  name_text_color,
  avatar_background_color,
  is_default
) VALUES (
  'Impostazioni Default',
  'Configurazione standard per l''export PNG delle formazioni',
  '#ffffff',
  2,
  '#000000',
  '2px 2px 4px rgba(0,0,0,0.9)',
  false,
  '#ffffff',
  '#000000',
  '#1a2332',
  true
);