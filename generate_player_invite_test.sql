-- Script per generare un codice invito player per test completo del flusso
-- Eseguire come superadmin (coach@elevenbase.pro) o come founder del team

-- 1. Trova il team per cui creare l'invito (sostituire con il team desiderato)
SELECT id, name, created_by FROM public.teams WHERE is_active = true ORDER BY created_at DESC LIMIT 5;

-- 2. Genera codice invito player (sostituire TEAM_ID_QUI con l'ID del team)
SELECT public.generate_team_invite(
    'TEAM_ID_QUI'::uuid,  -- _team_id: sostituire con ID team reale
    'player'::public.user_role,  -- _role: player
    3,  -- _max_uses: 3 utilizzi
    7   -- _expires_days: scade in 7 giorni
);

-- 3. Verifica invito creato
SELECT 
    id,
    code,
    role,
    max_uses,
    used_count,
    expires_at,
    is_active,
    created_at,
    team_id
FROM public.team_invites 
WHERE role = 'player' 
AND is_active = true 
ORDER BY created_at DESC 
LIMIT 3;

-- 4. Copia il codice e usa per registrare nuovo player su:
-- https://elevenbase.pro/register-invite?code=CODICE_QUI

-- 5. Dopo registrazione, verifica utente pending:
SELECT 
    tm.id,
    tm.role,
    tm.status,
    tm.ea_sports_id,
    tm.joined_at,
    u.email,
    t.name as team_name
FROM public.team_members tm
JOIN auth.users u ON tm.user_id = u.id
JOIN public.teams t ON tm.team_id = t.id
WHERE tm.status = 'pending'
AND tm.role = 'player'
ORDER BY tm.joined_at DESC;

-- 6. Test approvazione (sostituire MEMBER_ID_QUI con l'ID del membro)
SELECT public.approve_team_member(
    'MEMBER_ID_QUI'::uuid,  -- _member_id
    'Approvato per test flusso player'  -- _notes
);

-- 7. Verifica approvazione completata
SELECT 
    tm.id,
    tm.role,
    tm.status,
    tm.ea_sports_id,
    tm.approved_at,
    tm.notes,
    u.email
FROM public.team_members tm
JOIN auth.users u ON tm.user_id = u.id
WHERE tm.role = 'player'
AND tm.status = 'active'
ORDER BY tm.approved_at DESC
LIMIT 3;

-- FLUSSO COMPLETO PLAYER TEST:
-- 1. Esegui query 1-3 per generare codice invito
-- 2. Vai su https://elevenbase.pro/register-invite?code=CODICE_GENERATO
-- 3. Registrati come player con EA Sports ID (es: "TestPlayer123")
-- 4. Controlla email e conferma registrazione
-- 5. Login e verifica redirect a /pending-approval
-- 6. Login come founder e vai su /admin/users
-- 7. Approva il player pending dalla dashboard
-- 8. Logout e re-login come player - dovrebbe accedere al team