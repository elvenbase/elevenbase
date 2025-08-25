-- ENSURE OWNER IS ALWAYS ACTIVE
-- Il founder del team DEVE sempre essere attivo!
-- Date: 2025-01-24

-- 1. Fix la funzione per assicurare che owner sia SEMPRE active
CREATE OR REPLACE FUNCTION public.create_team_for_new_user(
    p_name text,
    p_fc_name text,
    p_abbreviation text,
    p_primary_color text,
    p_secondary_color text,
    p_owner_id uuid,
    p_invite_code text
)
RETURNS TABLE(id uuid, name text, fc_name text, abbreviation text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id uuid;
    v_invite_code_admin text;
    v_invite_code_coach text;
    v_invite_code_player text;
BEGIN
    -- 1. Create the team
    INSERT INTO public.teams (
        name, fc_name, abbreviation, primary_color, secondary_color, 
        owner_id, created_by, invite_code
    ) VALUES (
        p_name, p_fc_name, p_abbreviation, p_primary_color, p_secondary_color,
        p_owner_id, p_owner_id, p_invite_code
    )
    RETURNING teams.id INTO v_team_id;

    -- 2. IMPORTANTE: Owner è SEMPRE active! Non deve chiedere attivazione a nessuno!
    INSERT INTO public.team_members (
        team_id, 
        user_id, 
        role, 
        status,  -- SEMPRE 'active' per il founder!
        joined_at
    ) VALUES (
        v_team_id, 
        p_owner_id, 
        'admin', 
        'active',  -- <-- SEMPRE ACTIVE!
        NOW()
    );

    -- 3. Generate invite codes
    v_invite_code_admin := p_abbreviation || 'ADM' || substring(md5(random()::text) from 1 for 5);
    v_invite_code_coach := p_abbreviation || 'COACH' || substring(md5(random()::text) from 1 for 5);
    v_invite_code_player := p_abbreviation || 'PLAY' || substring(md5(random()::text) from 1 for 5);

    INSERT INTO public.team_invites (team_id, code, role, max_uses, expires_at, created_by) VALUES
    (v_team_id, v_invite_code_admin, 'admin', 1, NOW() + interval '8 months', p_owner_id),
    (v_team_id, v_invite_code_coach, 'coach', 5, NOW() + interval '8 months', p_owner_id),
    (v_team_id, v_invite_code_player, 'player', 50, NOW() + interval '10 months', p_owner_id);

    -- Return the created team
    RETURN QUERY 
    SELECT teams.id, teams.name, teams.fc_name, teams.abbreviation 
    FROM public.teams 
    WHERE teams.id = v_team_id;
END;
$$;

-- 2. FIX IMMEDIATO: Aggiorna TUTTI gli owner esistenti a status active
UPDATE public.team_members tm
SET status = 'active'
FROM public.teams t
WHERE tm.team_id = t.id
  AND tm.user_id = t.owner_id
  AND tm.status != 'active';

-- 3. Verifica che tutti gli owner siano attivi
SELECT 
    u.email,
    t.name as team_name,
    tm.role,
    tm.status,
    CASE 
        WHEN t.owner_id = u.id THEN '✅ OWNER - Deve essere ACTIVE'
        ELSE 'Member'
    END as note
FROM auth.users u
JOIN public.team_members tm ON tm.user_id = u.id
JOIN public.teams t ON t.id = tm.team_id
WHERE t.owner_id = u.id
ORDER BY t.created_at DESC;