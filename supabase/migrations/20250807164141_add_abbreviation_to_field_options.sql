-- Add abbreviation column to field_options table
ALTER TABLE public.field_options ADD COLUMN IF NOT EXISTS abbreviation TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_field_options_abbreviation ON field_options(abbreviation);

-- Add comment for documentation
COMMENT ON COLUMN field_options.abbreviation IS 'Two-letter abbreviation for the option (e.g., DC for Difensore Centrale)';

-- Update existing player_role options with abbreviations
UPDATE field_options SET abbreviation = 'DC' WHERE field_name = 'player_role' AND option_value = 'difensore_centrale';
UPDATE field_options SET abbreviation = 'TD' WHERE field_name = 'player_role' AND option_value = 'terzino_destro';
UPDATE field_options SET abbreviation = 'TS' WHERE field_name = 'player_role' AND option_value = 'terzino_sinistro';
UPDATE field_options SET abbreviation = 'ED' WHERE field_name = 'player_role' AND option_value = 'esterno_destro_basso';
UPDATE field_options SET abbreviation = 'ES' WHERE field_name = 'player_role' AND option_value = 'esterno_sinistro_basso';
UPDATE field_options SET abbreviation = 'MD' WHERE field_name = 'player_role' AND option_value = 'mediano';
UPDATE field_options SET abbreviation = 'RG' WHERE field_name = 'player_role' AND option_value = 'regista';
UPDATE field_options SET abbreviation = 'ML' WHERE field_name = 'player_role' AND option_value = 'mezzala';
UPDATE field_options SET abbreviation = 'IC' WHERE field_name = 'player_role' AND option_value = 'interno_centrocampo';
UPDATE field_options SET abbreviation = 'TQ' WHERE field_name = 'player_role' AND option_value = 'trequartista';
UPDATE field_options SET abbreviation = 'AD' WHERE field_name = 'player_role' AND option_value = 'ala_destra';
UPDATE field_options SET abbreviation = 'AS' WHERE field_name = 'player_role' AND option_value = 'ala_sinistra';
UPDATE field_options SET abbreviation = 'SP' WHERE field_name = 'player_role' AND option_value = 'seconda_punta';
UPDATE field_options SET abbreviation = 'FN' WHERE field_name = 'player_role' AND option_value = 'falso_nove';
UPDATE field_options SET abbreviation = 'CV' WHERE field_name = 'player_role' AND option_value = 'centravanti';

