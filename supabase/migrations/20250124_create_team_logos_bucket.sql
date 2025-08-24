-- ============================================
-- CREATE STORAGE BUCKET FOR TEAM LOGOS
-- Date: 2025-01-24
-- ============================================

-- Create the storage bucket for team logos
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos', 
  true, -- Public bucket so logos can be displayed
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for team logos

-- Allow anyone to view team logos (public bucket)
CREATE POLICY "Team logos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'team-logos');

-- Allow team owners to upload their team logo
CREATE POLICY "Team owners can upload logos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow team owners to update their team logo
CREATE POLICY "Team owners can update logos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'team-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow team owners to delete their team logo
CREATE POLICY "Team owners can delete logos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'team-logos' 
  AND auth.uid() IN (
    SELECT owner_id FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Note: After running this, team logos will be stored at:
-- https://[project-ref].supabase.co/storage/v1/object/public/team-logos/[team-id]/logo.png