-- Verifica i nuovi ruoli inseriti
SELECT 
  'NUOVI RUOLI INSERITI' as status,
  field_name,
  option_value,
  option_label,
  sort_order
FROM field_options 
WHERE field_name = 'player_role'
ORDER BY sort_order;

-- Conta totale ruoli
SELECT 
  'TOTALE RUOLI' as status,
  COUNT(*) as total_roles
FROM field_options 
WHERE field_name = 'player_role'; 