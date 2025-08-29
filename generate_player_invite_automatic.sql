-- Script automatico per generare codice invito player 
-- Trova automaticamente il team attivo più recente e genera l'invito

-- STEP 1: Trova teams attivi (mostra gli ultimi 5)
SELECT 
    '=== TEAMS DISPONIBILI ===' as info,
    id,
    name,
    abbreviation,
    created_at,
    (SELECT email FROM auth.users WHERE id = created_by) as founder_email
FROM public.teams 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 2: Genera invito player per il team più recente (automatico)
DO $$
DECLARE
    latest_team_id UUID;
    invite_result JSON;
BEGIN
    -- Trova il team più recente
    SELECT id INTO latest_team_id
    FROM public.teams 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF latest_team_id IS NULL THEN
        RAISE NOTICE 'Nessun team attivo trovato';
        RETURN;
    END IF;
    
    -- Genera invito player
    SELECT public.generate_team_invite(
        latest_team_id,  -- team_id automatico
        'player'::public.user_role,  -- role: player
        5,  -- max_uses: 5 utilizzi
        14  -- expires_days: scade in 14 giorni
    ) INTO invite_result;
    
    -- Mostra risultato
    RAISE NOTICE 'Invito creato: %', invite_result;
END $$;

-- STEP 3: Mostra inviti player attivi creati
SELECT 
    '=== INVITI PLAYER ATTIVI ===' as info,
    ti.code,
    ti.role,
    ti.max_uses,
    ti.used_count,
    ti.expires_at,
    ti.created_at,
    t.name as team_name,
    (SELECT email FROM auth.users WHERE id = ti.created_by) as creator_email
FROM public.team_invites ti
JOIN public.teams t ON ti.team_id = t.id
WHERE ti.role = 'player' 
AND ti.is_active = true 
AND ti.expires_at > NOW()
ORDER BY ti.created_at DESC;

-- STEP 4: Istruzioni per l'utente
SELECT 
    '=== PROSSIMI STEP ===' as info,
    'Copia uno dei codici sopra e vai su:' as step_1,
    'https://elevenbase.pro/register-invite?code=IL_CODICE_QUI' as step_2,
    'Registrati come player con EA Sports ID (es: TestPlayer456)' as step_3,
    'Poi testa il flusso di approvazione dalla dashboard /admin/users' as step_4;

-- BONUS: Query per verificare registrazioni pending dopo il test
-- (da eseguire dopo la registrazione del player)
/*
SELECT 
    '=== PLAYERS PENDING ===' as info,
    tm.id,
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
*/