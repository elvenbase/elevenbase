-- Create avatar_backgrounds table
CREATE TABLE IF NOT EXISTS avatar_backgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('color', 'image')),
  value TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_avatar_backgrounds_created_by ON avatar_backgrounds(created_by);
CREATE INDEX IF NOT EXISTS idx_avatar_backgrounds_is_default ON avatar_backgrounds(is_default);
CREATE INDEX IF NOT EXISTS idx_avatar_backgrounds_type ON avatar_backgrounds(type);

-- Enable RLS
ALTER TABLE avatar_backgrounds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own avatar backgrounds" ON avatar_backgrounds
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Public can view default avatar backgrounds" ON avatar_backgrounds
  FOR SELECT USING (is_default = true);

CREATE POLICY "Users can insert their own avatar backgrounds" ON avatar_backgrounds
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own avatar backgrounds" ON avatar_backgrounds
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own avatar backgrounds" ON avatar_backgrounds
  FOR DELETE USING (auth.uid() = created_by);

-- Create storage bucket for avatar backgrounds if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for avatar backgrounds
CREATE POLICY "Avatar backgrounds are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatar backgrounds" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their avatar backgrounds" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their avatar backgrounds" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
  );
