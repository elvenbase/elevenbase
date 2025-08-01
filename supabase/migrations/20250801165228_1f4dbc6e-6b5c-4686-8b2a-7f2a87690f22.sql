-- Create custom_formations table
CREATE TABLE public.custom_formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  defenders INTEGER NOT NULL DEFAULT 4,
  midfielders INTEGER NOT NULL DEFAULT 4,  
  forwards INTEGER NOT NULL DEFAULT 2,
  positions JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_formations ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_formations
CREATE POLICY "Coaches and admins can manage custom formations" 
ON public.custom_formations 
FOR ALL 
USING (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Everyone can view custom formations" 
ON public.custom_formations 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_formations_updated_at
BEFORE UPDATE ON public.custom_formations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();