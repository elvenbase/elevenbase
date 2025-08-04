-- Add gaming fields to players table
ALTER TABLE players 
ADD COLUMN ea_sport_id VARCHAR(255),
ADD COLUMN gaming_platform VARCHAR(20) CHECK (gaming_platform IN ('PC', 'PS5', 'Xbox')),
ADD COLUMN platform_id VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN players.ea_sport_id IS 'EA Sports account ID for the player';
COMMENT ON COLUMN players.gaming_platform IS 'Gaming platform used by the player (PC, PS5, Xbox)';
COMMENT ON COLUMN players.platform_id IS 'Platform-specific ID (PSN ID for PS5, Xbox Live ID for Xbox, empty for PC)';