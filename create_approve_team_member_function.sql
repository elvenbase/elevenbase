-- Crea la funzione approve_team_member per approvare membri del team
CREATE OR REPLACE FUNCTION public.approve_team_member(
    _member_id UUID,
    _notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    _result JSON;
    _member_record RECORD;
    _current_user_id UUID;
BEGIN
    -- Get current user ID
    _current_user_id := auth.uid();
    
    IF _current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Non autenticato'
        );
    END IF;
    
    -- Get member details
    SELECT tm.*, t.owner_id
    INTO _member_record
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.id = _member_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Membro non trovato'
        );
    END IF;
    
    -- Check if current user can approve (must be owner/founder)
    IF _member_record.owner_id != _current_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Non hai i permessi per approvare questo membro'
        );
    END IF;
    
    -- Check if member is already approved
    IF _member_record.status = 'active' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Il membro è già approvato'
        );
    END IF;
    
    -- Approve the member
    UPDATE team_members 
    SET 
        status = 'active',
        approved_by = _current_user_id,
        approved_at = NOW(),
        notes = COALESCE(_notes, notes)
    WHERE id = _member_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Membro approvato con successo'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Errore durante l''approvazione: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_team_member(UUID, TEXT) TO authenticated;