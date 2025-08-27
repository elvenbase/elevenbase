-- 🔧 FIX RLS PER TEAM_INVITES
-- Permetti l'accesso ai codici di invito per utenti anonimi (necessario per registrazione)

-- 1. Abilita RLS se non già abilitato
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- 2. Policy per lettura pubblica dei codici di invito attivi
-- (Solo per la verifica durante registrazione)
CREATE POLICY "team_invites_public_read" ON team_invites
    FOR SELECT 
    TO anon, authenticated
    USING (
        is_active = true 
        AND expires_at >= NOW()
    );

-- 3. Policy per lettura completa per membri del team
CREATE POLICY "team_invites_team_read" ON team_invites
    FOR SELECT 
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Policy per scrittura solo admin del team
CREATE POLICY "team_invites_admin_write" ON team_invites
    FOR ALL
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        team_id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- 5. Policy per aggiornamento contatori (per tutti quando usano codice)
CREATE POLICY "team_invites_usage_update" ON team_invites
    FOR UPDATE
    TO anon, authenticated
    USING (
        is_active = true 
        AND expires_at >= NOW()
        AND used_count < max_uses
    )
    WITH CHECK (
        is_active = true 
        AND expires_at >= NOW()
    );