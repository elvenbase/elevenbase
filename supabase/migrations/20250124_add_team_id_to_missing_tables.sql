-- Migration per aggiungere team_id a tutte le tabelle mancanti dal multi-team
-- Esegui questo script nel SQL Editor di Supabase

-- ============================================
-- STEP 1: AGGIUNGI team_id ALLE TABELLE MANCANTI
-- ============================================

-- 1. training_trialist_invites
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_trialist_invites') THEN
        ALTER TABLE public.training_trialist_invites 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_training_trialist_invites_team ON public.training_trialist_invites(team_id);
        
        RAISE NOTICE 'Added team_id to training_trialist_invites';
    END IF;
END $$;

-- 2. match_trialist_invites
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_trialist_invites') THEN
        ALTER TABLE public.match_trialist_invites 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_match_trialist_invites_team ON public.match_trialist_invites(team_id);
        
        RAISE NOTICE 'Added team_id to match_trialist_invites';
    END IF;
END $$;

-- 3. training_lineups
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_lineups') THEN
        ALTER TABLE public.training_lineups 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_training_lineups_team ON public.training_lineups(team_id);
        
        RAISE NOTICE 'Added team_id to training_lineups';
    END IF;
END $$;

-- 4. match_attendance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_attendance') THEN
        ALTER TABLE public.match_attendance 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_match_attendance_team ON public.match_attendance(team_id);
        
        RAISE NOTICE 'Added team_id to match_attendance';
    END IF;
END $$;

-- 5. attendance_score_settings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_score_settings') THEN
        ALTER TABLE public.attendance_score_settings 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_attendance_score_settings_team ON public.attendance_score_settings(team_id);
        
        RAISE NOTICE 'Added team_id to attendance_score_settings';
    END IF;
END $$;

-- 6. quick_trial_evaluations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_trial_evaluations') THEN
        ALTER TABLE public.quick_trial_evaluations 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_quick_trial_evaluations_team ON public.quick_trial_evaluations(team_id);
        
        RAISE NOTICE 'Added team_id to quick_trial_evaluations';
    END IF;
END $$;

-- 7. player_evaluations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_evaluations') THEN
        ALTER TABLE public.player_evaluations 
        ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_player_evaluations_team ON public.player_evaluations(team_id);
        
        RAISE NOTICE 'Added team_id to player_evaluations';
    END IF;
END $$;

-- ============================================
-- STEP 2: ABILITA RLS SU TUTTE LE TABELLE
-- ============================================

-- Abilita RLS se le tabelle esistono
DO $$
DECLARE
    table_names text[] := ARRAY[
        'training_trialist_invites',
        'match_trialist_invites', 
        'training_lineups',
        'match_attendance',
        'attendance_score_settings',
        'quick_trial_evaluations',
        'player_evaluations'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' ENABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'Enabled RLS on %', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: CREA RLS POLICIES GENERICHE
-- ============================================

-- match_trialist_invites policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_trialist_invites') THEN
        DROP POLICY IF EXISTS "Team members can view match trialist invites" ON public.match_trialist_invites;
        DROP POLICY IF EXISTS "Team coaches can manage match trialist invites" ON public.match_trialist_invites;
        
        CREATE POLICY "Team members can view match trialist invites" 
          ON public.match_trialist_invites FOR SELECT 
          USING (
            team_id IS NULL OR -- Legacy data
            EXISTS(
              SELECT 1 FROM public.team_members tm 
              WHERE tm.team_id = match_trialist_invites.team_id 
              AND tm.user_id = auth.uid() 
              AND tm.status = 'active'
            )
          );

        CREATE POLICY "Team coaches can manage match trialist invites" 
          ON public.match_trialist_invites FOR ALL 
          USING (
            team_id IS NOT NULL AND
            EXISTS(
              SELECT 1 FROM public.team_members tm 
              WHERE tm.team_id = match_trialist_invites.team_id 
              AND tm.user_id = auth.uid() 
              AND tm.status = 'active'
              AND tm.role IN ('admin', 'coach')
            )
          );
          
        RAISE NOTICE 'Created RLS policies for match_trialist_invites';
    END IF;
END $$;

-- training_trialist_invites policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_trialist_invites') THEN
        DROP POLICY IF EXISTS "Team members can view training trialist invites" ON public.training_trialist_invites;
        DROP POLICY IF EXISTS "Team coaches can manage training trialist invites" ON public.training_trialist_invites;
        
        CREATE POLICY "Team members can view training trialist invites" 
          ON public.training_trialist_invites FOR SELECT 
          USING (
            team_id IS NULL OR -- Legacy data
            EXISTS(
              SELECT 1 FROM public.team_members tm 
              WHERE tm.team_id = training_trialist_invites.team_id 
              AND tm.user_id = auth.uid() 
              AND tm.status = 'active'
            )
          );

        CREATE POLICY "Team coaches can manage training trialist invites" 
          ON public.training_trialist_invites FOR ALL 
          USING (
            team_id IS NOT NULL AND
            EXISTS(
              SELECT 1 FROM public.team_members tm 
              WHERE tm.team_id = training_trialist_invites.team_id 
              AND tm.user_id = auth.uid() 
              AND tm.status = 'active'
              AND tm.role IN ('admin', 'coach')
            )
          );
          
        RAISE NOTICE 'Created RLS policies for training_trialist_invites';
    END IF;
END $$;

-- ============================================
-- STEP 4: MIGRA DATI ESISTENTI AL TEAM CDR
-- ============================================

DO $$
DECLARE
    v_cdr_team_id uuid;
    v_updated_count integer;
    table_names text[] := ARRAY[
        'training_trialist_invites',
        'match_trialist_invites', 
        'training_lineups',
        'match_attendance',
        'attendance_score_settings',
        'quick_trial_evaluations',
        'player_evaluations'
    ];
    table_name text;
BEGIN
    -- Trova il team Ca De Rissi
    SELECT id INTO v_cdr_team_id
    FROM teams
    WHERE name = 'Ca De Rissi SG'
    LIMIT 1;
    
    IF v_cdr_team_id IS NULL THEN
        RAISE NOTICE 'Team Ca De Rissi SG non trovato!';
        RETURN;
    END IF;
    
    -- Aggiorna tutte le tabelle che esistono
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE 'UPDATE public.' || quote_ident(table_name) || ' SET team_id = $1 WHERE team_id IS NULL' 
            USING v_cdr_team_id;
            
            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
            RAISE NOTICE 'Aggiornati % records in % -> Ca De Rissi SG', v_updated_count, table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- STEP 5: VERIFICA FINALE
-- ============================================

-- Verifica che tutte le tabelle abbiano team_id
SELECT 
    t.table_name,
    CASE WHEN c.column_name IS NOT NULL THEN 'HAS team_id' ELSE 'MISSING team_id' END as team_id_status,
    CASE WHEN p.tablename IS NOT NULL THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as rls_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name 
    AND c.table_schema = t.table_schema 
    AND c.column_name = 'team_id'
LEFT JOIN pg_tables p ON p.tablename = t.table_name 
    AND p.schemaname = t.table_schema
    AND p.rowsecurity = true
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'training_trialist_invites',
        'match_trialist_invites', 
        'training_lineups',
        'match_attendance',
        'attendance_score_settings',
        'quick_trial_evaluations',
        'player_evaluations',
        'opponents',
        'competitions'
    )
ORDER BY t.table_name;