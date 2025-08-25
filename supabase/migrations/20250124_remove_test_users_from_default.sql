-- RIMUOVI GLI UTENTI TEST DAL TEAM DI DEFAULT
-- Esegui questo in Supabase SQL Editor

-- 1. Verifica quali utenti sono nel team di default
SELECT 
    u.email,
    tm.role,
    tm.created_at,
    t.name as team_name
FROM public.team_members tm
JOIN auth.users u ON u.id = tm.user_id
JOIN public.teams t ON t.id = tm.team_id
WHERE t.name = 'Ca De Rissi SG'
  AND u.email LIKE '%+%@gmail.com' -- Solo utenti con alias Gmail
ORDER BY tm.created_at DESC;

-- 2. RIMUOVI gli utenti test dal team di default
-- ATTENZIONE: Esegui solo se sei sicuro!
DELETE FROM public.team_members
WHERE team_id = (SELECT id FROM public.teams WHERE name = 'Ca De Rissi SG')
  AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%+%@gmail.com' -- Solo alias Gmail
      AND email != 'andrea.camolese@gmail.com' -- Mantieni l'originale
  );

-- 3. Verifica che siano stati rimossi
SELECT 
    u.email,
    COUNT(tm.id) as team_count
FROM auth.users u
LEFT JOIN public.team_members tm ON tm.user_id = u.id
WHERE u.email LIKE 'a.camolese%@gmail.com'
GROUP BY u.email
ORDER BY u.email;