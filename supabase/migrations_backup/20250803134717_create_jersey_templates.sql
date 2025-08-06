-- Create jersey templates table
CREATE TABLE IF NOT EXISTS jersey_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create an index on the default flag for performance
CREATE INDEX idx_jersey_templates_default ON jersey_templates(is_default);

-- Enable RLS
ALTER TABLE jersey_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Jersey templates are viewable by authenticated users" 
    ON jersey_templates FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Jersey templates can be created by authenticated users" 
    ON jersey_templates FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Jersey templates can be updated by their creators" 
    ON jersey_templates FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Jersey templates can be deleted by their creators" 
    ON jersey_templates FOR DELETE 
    TO authenticated 
    USING (auth.uid() = created_by);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at_jersey_templates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_jersey_templates
    BEFORE UPDATE ON jersey_templates
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at_jersey_templates();

-- Create storage bucket for jerseys
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'jerseys',
    'jerseys',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Set up storage policies for jerseys bucket
CREATE POLICY "Jersey images are publicly viewable" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'jerseys');

CREATE POLICY "Authenticated users can upload jersey images" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'jerseys');

CREATE POLICY "Users can update their own jersey images" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'jerseys');

CREATE POLICY "Users can delete their own jersey images" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'jerseys');

-- Insert default jersey template
INSERT INTO jersey_templates (name, description, image_url, is_default, created_by)
VALUES (
    'Maglia Default', 
    'Maglia di default del sistema', 
    '/lovable-uploads/jersey-example.png', 
    true, 
    NULL
);