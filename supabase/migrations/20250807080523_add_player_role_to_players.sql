-- Add player_role column to players table
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS player_role TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_players_player_role ON players(player_role);

-- Add comment for documentation
COMMENT ON COLUMN players.player_role IS 'Role of the player (e.g., attaccante, centrocampista, difensore, portiere)';
