-- Verifica quali giocatori vede l'utente

-- 1. Quali giocatori esistono e a quale team appartengono?
SELECT 
    p.first_name,
    p.last_name,
    p.team_id,
    t.name as team_name
FROM public.players p
LEFT JOIN public.teams t ON t.id = p.team_id
ORDER BY t.name, p.last_name;

-- 2. Conta giocatori per team
SELECT 
    t.name as team_name,
    COUNT(p.id) as num_players
FROM public.teams t
LEFT JOIN public.players p ON p.team_id = t.id
GROUP BY t.name
ORDER BY t.name;