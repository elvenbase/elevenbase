-- Create function to seed guest players for a team
-- This creates generic guest players that can be reused across matches
-- Limited to maximum 11 guests per team (one full formation)
CREATE OR REPLACE FUNCTION seed_team_guests(_team UUID, _count INTEGER DEFAULT 5)
RETURNS SETOF players
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    guest_record players%ROWTYPE;
    existing_guests_count INTEGER;
    max_guests_to_create INTEGER;
    i INTEGER;
BEGIN
    -- Check how many guests already exist for this team
    SELECT COUNT(*) INTO existing_guests_count
    FROM players 
    WHERE team_id = _team 
      AND is_guest = true;
    
    -- Ensure we don't exceed 11 guests total
    max_guests_to_create := LEAST(_count, 11 - existing_guests_count);
    
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
    
    -- Create guest players if they don't exist (up to 11 total)
    FOR i IN 1..11 LOOP
        -- Check if guest already exists
        SELECT * INTO guest_record
        FROM players 
        WHERE team_id = _team 
          AND is_guest = true 
          AND first_name = 'Ospite'
          AND last_name = i::text;
          
        -- If guest doesn't exist and we haven't reached the limit, create it
        IF NOT FOUND AND i <= (existing_guests_count + max_guests_to_create) THEN
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
        
        -- Return the guest if it exists (either found or just created)
        IF guest_record.id IS NOT NULL THEN
            RETURN NEXT guest_record;
            guest_record.id := NULL; -- Reset for next iteration
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;