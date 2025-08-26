-- Fix Captain Constraint: da globale a per-team
-- Data: 2025-08-26

-- 1. Rimuovi il constraint globale esistente
DROP INDEX IF EXISTS idx_players_single_captain;

-- 2. Crea nuovo constraint: un solo capitano per team
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_single_captain_per_team 
ON public.players(team_id) 
WHERE is_captain = true;

-- 3. Verifica che non ci siano conflitti esistenti
-- (Questa query ti mostrerà se ci sono team con più capitani)
-- SELECT team_id, COUNT(*) as captain_count 
-- FROM players 
-- WHERE is_captain = true 
-- GROUP BY team_id 
-- HAVING COUNT(*) > 1;

-- 4. Opzionale: Se ci sono conflitti, ripulisci i duplicati
-- UPDATE players 
-- SET is_captain = false 
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (team_id) id 
--   FROM players 
--   WHERE is_captain = true 
--   ORDER BY team_id, created_at DESC
-- ) AND is_captain = true;