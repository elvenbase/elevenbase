-- Conta giocatori per team
SELECT 
    COALESCE(t.name, 'NESSUN TEAM') as team_name,
    COUNT(p.id) as num_players
FROM public.players p
LEFT JOIN public.teams t ON t.id = p.team_id
GROUP BY t.name
ORDER BY num_players DESC;