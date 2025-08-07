-- Verifica che i ruoli siano stati puliti e reinseriti correttamente
SELECT 
  'RUOLI FINALI' as status,
  field_name,
  option_value,
  option_label,
  sort_order
FROM field_options 
WHERE field_name = 'player_role'
ORDER BY sort_order;

-- Conta totale ruoli (dovrebbe essere esattamente 15)
SELECT 
  'TOTALE RUOLI' as status,
  COUNT(*) as total_roles,
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ CORRETTO - 15 ruoli inseriti'
    ELSE '❌ ERRORE - Numero ruoli non corretto'
  END as verification
FROM field_options 
WHERE field_name = 'player_role';

-- Verifica che non ci siano duplicati
SELECT 
  'VERIFICA DUPLICATI' as status,
  option_value,
  COUNT(*) as occurrences
FROM field_options 
WHERE field_name = 'player_role'
GROUP BY option_value
HAVING COUNT(*) > 1; 