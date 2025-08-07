-- Cancella i ruoli attuali
DELETE FROM field_options WHERE field_name = 'player_role';

-- Verifica che siano stati cancellati
SELECT 
  'RUOLI RIMANENTI' as status,
  field_name,
  option_value,
  option_label
FROM field_options 
WHERE field_name = 'player_role'
ORDER BY sort_order; 