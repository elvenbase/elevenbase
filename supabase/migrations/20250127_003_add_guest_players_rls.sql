-- Add RLS policy to allow team coaches/admins to insert guest players
-- or use SECURITY DEFINER function for bypass

-- Option 1: Allow team coaches/admins to insert players (including guests)
CREATE POLICY IF NOT EXISTS "coaches_can_insert_players_including_guests"
ON players FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = players.team_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('coach', 'admin', 'owner')
          AND tm.status = 'active'
    )
);

-- Ensure guest players are readable by team members
CREATE POLICY IF NOT EXISTS "team_members_can_read_guest_players"
ON players FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = players.team_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
    )
);