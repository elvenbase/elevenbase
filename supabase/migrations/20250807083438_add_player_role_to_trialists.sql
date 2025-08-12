-- Add player_role column to trialists table
ALTER TABLE public.trialists ADD COLUMN IF NOT EXISTS player_role TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_trialists_player_role ON trialists(player_role);

-- Add comment for documentation
COMMENT ON COLUMN trialists.player_role IS 'Role of the trialist (e.g., attaccante, centrocampista, difensore, portiere)';
