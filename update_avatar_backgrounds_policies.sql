-- Update avatar_backgrounds policies to allow public access to default backgrounds

-- Add policy for public access to default backgrounds
DROP POLICY IF EXISTS "Public can view default avatar backgrounds" ON avatar_backgrounds;
CREATE POLICY "Public can view default avatar backgrounds" ON avatar_backgrounds
  FOR SELECT USING (is_default = true);