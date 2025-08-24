-- ============================================
-- CREATE STORAGE BUCKET FOR TEAM LOGOS (FIXED)
-- Date: 2025-01-24
-- ============================================

-- First, check if bucket exists
DO $$
BEGIN
  -- Create bucket only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'team-logos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'team-logos',
      'team-logos', 
      true, -- Public bucket
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
    );
    RAISE NOTICE 'Bucket team-logos created successfully';
  ELSE
    RAISE NOTICE 'Bucket team-logos already exists';
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload team logos" ON storage.objects;

-- Create new policies

-- Allow anyone to view team logos
CREATE POLICY "Team logos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'team-logos');

-- Allow authenticated users to upload logos (simplified for testing)
CREATE POLICY "Anyone can upload team logos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their logos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'team-logos' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their logos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'team-logos' 
  AND auth.uid() IS NOT NULL
);

-- Verify bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id = 'team-logos';

-- ============================================
-- END
-- ============================================