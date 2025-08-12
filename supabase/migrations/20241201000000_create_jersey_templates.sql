-- ============================================================================
-- MIGRATION: Create Jersey Templates System
-- ============================================================================
-- This migration creates the complete jersey templates system
-- ============================================================================

-- 1. Create jersey templates table
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

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_jersey_templates_default ON jersey_templates(is_default);

-- 3. Enable Row Level Security
ALTER TABLE jersey_templates ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DO $$ 
BEGIN
    -- Drop policies if they exist (to avoid errors on re-run)
    DROP POLICY IF EXISTS "Jersey templates are viewable by authenticated users" ON jersey_templates;
    DROP POLICY IF EXISTS "Jersey templates can be created by authenticated users" ON jersey_templates;
    DROP POLICY IF EXISTS "Jersey templates can be updated by their creators" ON jersey_templates;
    DROP POLICY IF EXISTS "Jersey templates can be deleted by their creators" ON jersey_templates;
    
    -- Create new policies
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
END $$;

-- 5. Create function for updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at_jersey_templates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_jersey_templates ON jersey_templates;
CREATE TRIGGER set_updated_at_jersey_templates
    BEFORE UPDATE ON jersey_templates
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at_jersey_templates();

-- 7. Create storage bucket for jerseys (if it doesn't exist)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'jerseys',
        'jerseys',
        true,
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 8. Set up storage policies for jerseys bucket
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Jersey images are publicly viewable" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload jersey images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own jersey images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own jersey images" ON storage.objects;
    
    -- Create new policies
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
END $$;

-- 9. Insert default jersey template
INSERT INTO jersey_templates (name, description, image_url, is_default, created_by)
VALUES (
    'Maglia Default', 
    'Maglia di default del sistema', 
    '/lovable-uploads/jersey-example.png', 
    true, 
    NULL
)
ON CONFLICT DO NOTHING;