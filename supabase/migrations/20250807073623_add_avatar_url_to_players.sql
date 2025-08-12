-- Add avatar_url column to players table
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for player avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('player-avatars', 'player-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for player avatars
DROP POLICY IF EXISTS "Player avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Player avatars are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'player-avatars');

DROP POLICY IF EXISTS "Authenticated users can upload player avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload player avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update player avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update player avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete player avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete player avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');
