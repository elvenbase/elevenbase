-- Migration: Add gaming and jersey fields to trialists table
-- Purpose: Align trialists fields with players for promotion functionality

ALTER TABLE public.trialists 
ADD COLUMN IF NOT EXISTS jersey_number INTEGER,
ADD COLUMN IF NOT EXISTS ea_sport_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gaming_platform VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_id VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN public.trialists.jersey_number IS 'Numero di maglia del trialist (opzionale, per allineamento con players)';
COMMENT ON COLUMN public.trialists.ea_sport_id IS 'ID EA Sports del trialist per gaming online';
COMMENT ON COLUMN public.trialists.gaming_platform IS 'Piattaforma gaming principale (PS5, Xbox, PC, ecc.)';
COMMENT ON COLUMN public.trialists.platform_id IS 'ID specifico della piattaforma gaming scelta';

-- Create index for performance on jersey_number (will be used for uniqueness checks)
CREATE INDEX IF NOT EXISTS idx_trialists_jersey_number ON public.trialists(jersey_number) WHERE jersey_number IS NOT NULL;

-- Create index for gaming platform filtering
CREATE INDEX IF NOT EXISTS idx_trialists_gaming_platform ON public.trialists(gaming_platform) WHERE gaming_platform IS NOT NULL;