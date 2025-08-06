-- Create storage bucket for player avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('player-avatars', 'player-avatars', true);

-- Add avatar_url column to players table
ALTER TABLE public.players ADD COLUMN avatar_url TEXT;

-- Create storage policies for player avatars
CREATE POLICY "Player avatars are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'player-avatars');

CREATE POLICY "Authenticated users can upload player avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update player avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete player avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'player-avatars' AND auth.role() = 'authenticated');