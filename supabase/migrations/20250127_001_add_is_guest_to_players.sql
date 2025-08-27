-- Add is_guest column to players table
-- This allows marking players as guests (not part of official roster)
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_players_is_guest ON players(is_guest);

-- Add index for team_id and is_guest combination (common query pattern)
CREATE INDEX IF NOT EXISTS idx_players_team_guest ON players(team_id, is_guest);