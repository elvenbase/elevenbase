-- Test query to verify gaming fields are working
SELECT 
  first_name,
  last_name,
  ea_sport_id,
  gaming_platform,
  platform_id,
  created_at
FROM players 
WHERE ea_sport_id IS NOT NULL 
   OR gaming_platform IS NOT NULL 
   OR platform_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;