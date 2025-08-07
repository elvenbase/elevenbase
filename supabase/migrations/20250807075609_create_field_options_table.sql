-- Create field_options table for managing select field options
CREATE TABLE public.field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL, -- es. 'player_role', 'position', 'status'
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(field_name, option_value)
);

-- Create indexes for better performance
CREATE INDEX idx_field_options_field_name ON field_options(field_name);
CREATE INDEX idx_field_options_sort_order ON field_options(sort_order);
CREATE INDEX idx_field_options_is_active ON field_options(is_active);
CREATE INDEX idx_field_options_created_by ON field_options(created_by);

-- Enable RLS
ALTER TABLE field_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all field options" ON field_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage field options" ON field_options
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role)
  );

-- Insert default player roles
INSERT INTO field_options (field_name, option_value, option_label, sort_order, created_by) VALUES
('player_role', 'attaccante', 'Attaccante', 1, NULL),
('player_role', 'centrocampista', 'Centrocampista', 2, NULL),
('player_role', 'difensore', 'Difensore', 3, NULL),
('player_role', 'portiere', 'Portiere', 4, NULL);

-- Insert default positions
INSERT INTO field_options (field_name, option_value, option_label, sort_order, created_by) VALUES
('position', 'P', 'Portiere', 1, NULL),
('position', 'D', 'Difensore', 2, NULL),
('position', 'C', 'Centrocampista', 3, NULL),
('position', 'A', 'Attaccante', 4, NULL);

-- Insert default status options
INSERT INTO field_options (field_name, option_value, option_label, sort_order, created_by) VALUES
('status', 'active', 'Attivo', 1, NULL),
('status', 'inactive', 'Inattivo', 2, NULL),
('status', 'injured', 'Ferito', 3, NULL),
('status', 'suspended', 'Squalificato', 4, NULL);
