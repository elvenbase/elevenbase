-- FORCE UPDATE: Replace the seed_team_guests function with correct logic
-- This ensures the function actually creates guests instead of being stuck

DROP FUNCTION IF EXISTS seed_team_guests(UUID, INTEGER);

CREATE OR REPLACE FUNCTION seed_team_guests(_team UUID, _count INTEGER DEFAULT 5)
RETURNS SETOF players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    guest_record players%ROWTYPE;
    existing_guests_count INTEGER;
    total_created INTEGER := 0;
    i INTEGER;
BEGIN
    -- Check how many guests already exist for this team
    SELECT COUNT(*) INTO existing_guests_count
    FROM players 
    WHERE team_id = _team 
      AND is_guest = true;
    
    -- If we already have 11 or more guests, return existing ones
    IF existing_guests_count >= 11 THEN
        FOR guest_record IN 
            SELECT * FROM players 
            WHERE team_id = _team 
              AND is_guest = true 
            ORDER BY last_name::INTEGER
            LIMIT 11
        LOOP
            RETURN NEXT guest_record;
        END LOOP;
        RETURN;
    END IF;
    
    -- Create missing guest players in sequence from 1 to 11
    FOR i IN 1..11 LOOP
        -- Reset guest_record for each iteration
        guest_record := NULL;
        
        -- Check if guest already exists
        SELECT * INTO guest_record
        FROM players 
        WHERE team_id = _team 
          AND is_guest = true 
          AND first_name = 'Ospite'
          AND last_name = i::text;
          
        -- If guest doesn't exist, create it (unless we've hit the limit)
        IF guest_record.id IS NULL AND existing_guests_count + total_created < 11 THEN
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
            
            -- Increment counter
            total_created := total_created + 1;
        END IF;
        
        -- Return the guest if it exists (either found or just created)
        IF guest_record.id IS NOT NULL THEN
            RETURN NEXT guest_record;
        END IF;
        
        -- Stop if we have enough guests
        IF existing_guests_count + total_created >= 11 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION seed_team_guests(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION seed_team_guests(UUID, INTEGER) TO anon;