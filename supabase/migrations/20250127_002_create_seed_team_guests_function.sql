-- Create function to seed guest players for a team
-- This creates generic guest players that can be reused across matches
CREATE OR REPLACE FUNCTION seed_team_guests(_team UUID, _count INTEGER DEFAULT 5)
RETURNS SETOF players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    guest_record players%ROWTYPE;
    i INTEGER;
BEGIN
    -- Create guest players if they don't exist
    FOR i IN 1.._count LOOP
        -- Check if guest already exists
        SELECT * INTO guest_record
        FROM players 
        WHERE team_id = _team 
          AND is_guest = true 
          AND first_name = 'Ospite'
          AND last_name = i::text;
          
        -- If guest doesn't exist, create it
        IF NOT FOUND THEN
            INSERT INTO players (
                team_id,
                first_name,
                last_name,
                is_guest,
                status,
                created_at,
                updated_at
            ) VALUES (
                _team,
                'Ospite',
                i::text,
                true,
                'active',
                NOW(),
                NOW()
            ) RETURNING * INTO guest_record;
        END IF;
        
        RETURN NEXT guest_record;
    END LOOP;
    
    RETURN;
END;
$$;