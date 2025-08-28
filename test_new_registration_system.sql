-- ============================================
-- TEST COMPLETO NUOVO SISTEMA REGISTRAZIONE
-- Verifica funzionamento di tutti i flussi
-- Data: 2025-01-27
-- ============================================

-- STEP 1: PULIZIA E PREPARAZIONE TEST
-- ============================================

-- Rimuovi dati di test precedenti (se esistono)
DELETE FROM team_members WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);
DELETE FROM teams WHERE name LIKE '%Test%';

-- STEP 2: TEST FUNZIONI HELPER
-- ============================================

-- Test 1: Verifica funzione superadmin
SELECT 
  'TEST 1 - SUPERADMIN CHECK' as test_name,
  CASE 
    WHEN is_superadmin((SELECT id FROM auth.users WHERE email = 'coach@elevenbase.pro' LIMIT 1)) THEN 'PASS'
    ELSE 'FAIL - Superadmin non riconosciuto'
  END as result;

-- Test 2: Genera codice invito (simulazione)
SELECT 
  'TEST 2 - GENERATE INVITE CODE' as test_name,
  CASE 
    WHEN length(generate_invite_code()) = 8 THEN 'PASS'
    ELSE 'FAIL - Codice invito non generato correttamente'
  END as result;

-- Test 3: Validazione EA Sports ID
SELECT 
  'TEST 3 - EA SPORTS ID VALIDATION' as test_name,
  validate_ea_sports_id('TEST_EA_ID_123', NULL) as validation_result;

-- STEP 3: TEST REGISTRAZIONE FOUNDER
-- ============================================

-- Simula registrazione founder (senza creare utente auth reale)
DO $$
DECLARE
  test_user_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  test_result JSON;
BEGIN
  -- Simula user in auth.users per il test
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    test_user_id,
    'test-founder@example.com',
    'encrypted_password_placeholder',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Test registrazione founder
  SELECT register_founder_with_team(
    test_user_id,
    'Test Team Founder',
    'TTF',
    '#FF0000',
    '#0000FF'
  ) INTO test_result;

  RAISE NOTICE 'TEST FOUNDER REGISTRATION: %', test_result;
END $$;

-- Verifica risultato
SELECT 
  'TEST 4 - FOUNDER REGISTRATION' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM teams 
      WHERE name = 'Test Team Founder' 
      AND abbreviation = 'TTF'
    ) AND EXISTS (
      SELECT 1 FROM team_members 
      WHERE role = 'founder' 
      AND status = 'active'
      AND user_id = '11111111-1111-1111-1111-111111111111'::UUID
    ) THEN 'PASS'
    ELSE 'FAIL - Team o founder non creati correttamente'
  END as result;

-- STEP 4: TEST GENERAZIONE INVITI
-- ============================================

-- Genera invito admin
DO $$
DECLARE
  test_team_id UUID;
  test_founder_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  invite_result JSON;
BEGIN
  -- Ottieni team ID
  SELECT id INTO test_team_id FROM teams WHERE name = 'Test Team Founder';
  
  -- Genera invito admin
  SELECT generate_team_invite(
    test_team_id,
    'admin',
    5,
    7
  ) INTO invite_result;

  RAISE NOTICE 'TEST ADMIN INVITE: %', invite_result;
END $$;

-- Genera invito player
DO $$
DECLARE
  test_team_id UUID;
  test_founder_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  invite_result JSON;
BEGIN
  -- Ottieni team ID
  SELECT id INTO test_team_id FROM teams WHERE name = 'Test Team Founder';
  
  -- Genera invito player
  SELECT generate_team_invite(
    test_team_id,
    'player',
    10,
    14
  ) INTO invite_result;

  RAISE NOTICE 'TEST PLAYER INVITE: %', invite_result;
END $$;

-- Verifica inviti creati
SELECT 
  'TEST 5 - INVITE GENERATION' as test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM team_invites 
      WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
      AND role IN ('admin', 'player')
      AND is_active = true
    ) = 2 THEN 'PASS'
    ELSE 'FAIL - Inviti non generati correttamente'
  END as result;

-- STEP 5: TEST REGISTRAZIONE CON INVITO
-- ============================================

-- Test registrazione admin con invito
DO $$
DECLARE
  test_admin_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  test_invite_code TEXT;
  test_result JSON;
BEGIN
  -- Ottieni codice invito admin
  SELECT code INTO test_invite_code 
  FROM team_invites 
  WHERE role = 'admin' 
  AND team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
  LIMIT 1;

  -- Simula user admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    test_admin_id,
    'test-admin@example.com',
    'encrypted_password_placeholder',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Test registrazione admin
  SELECT register_with_invite_code(
    test_admin_id,
    test_invite_code,
    NULL -- Admin non ha EA Sports ID
  ) INTO test_result;

  RAISE NOTICE 'TEST ADMIN INVITE REGISTRATION: %', test_result;
END $$;

-- Test registrazione player con invito
DO $$
DECLARE
  test_player_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
  test_invite_code TEXT;
  test_result JSON;
BEGIN
  -- Ottieni codice invito player
  SELECT code INTO test_invite_code 
  FROM team_invites 
  WHERE role = 'player' 
  AND team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
  LIMIT 1;

  -- Simula user player
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    test_player_id,
    'test-player@example.com',
    'encrypted_password_placeholder',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Test registrazione player
  SELECT register_with_invite_code(
    test_player_id,
    test_invite_code,
    'TEST_EA_PLAYER_001'
  ) INTO test_result;

  RAISE NOTICE 'TEST PLAYER INVITE REGISTRATION: %', test_result;
END $$;

-- Verifica registrazioni
SELECT 
  'TEST 6 - INVITE REGISTRATIONS' as test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM team_members 
      WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
      AND status = 'pending'
      AND role IN ('admin', 'player')
    ) = 2 THEN 'PASS'
    ELSE 'FAIL - Registrazioni con invito non funzionanti'
  END as result;

-- STEP 6: TEST APPROVAZIONI
-- ============================================

-- Test lista pending approvals
SELECT 
  'TEST 7 - PENDING APPROVALS LIST' as test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM get_pending_approvals(
        (SELECT id FROM teams WHERE name = 'Test Team Founder')
      )
    ) = 2 THEN 'PASS'
    ELSE 'FAIL - Lista approvazioni non corretta'
  END as result;

-- Test approvazione admin
DO $$
DECLARE
  test_member_id UUID;
  approval_result JSON;
BEGIN
  -- Ottieni member_id dell'admin in pending
  SELECT id INTO test_member_id 
  FROM team_members 
  WHERE role = 'admin' 
  AND status = 'pending'
  AND team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
  LIMIT 1;

  -- Approva admin
  SELECT approve_team_member(
    test_member_id,
    'Approvazione test automatica'
  ) INTO approval_result;

  RAISE NOTICE 'TEST ADMIN APPROVAL: %', approval_result;
END $$;

-- Test approvazione player
DO $$
DECLARE
  test_member_id UUID;
  approval_result JSON;
BEGIN
  -- Ottieni member_id del player in pending
  SELECT id INTO test_member_id 
  FROM team_members 
  WHERE role = 'player' 
  AND status = 'pending'
  AND team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
  LIMIT 1;

  -- Approva player
  SELECT approve_team_member(
    test_member_id,
    'Approvazione test automatica'
  ) INTO approval_result;

  RAISE NOTICE 'TEST PLAYER APPROVAL: %', approval_result;
END $$;

-- Verifica approvazioni
SELECT 
  'TEST 8 - APPROVALS' as test_name,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM team_members 
      WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
      AND status = 'active'
    ) = 3 THEN 'PASS' -- founder + admin + player
    ELSE 'FAIL - Approvazioni non funzionanti'
  END as result;

-- STEP 7: TEST PERMESSI E SICUREZZA
-- ============================================

-- Test permessi founder
SELECT 
  'TEST 9 - FOUNDER PERMISSIONS' as test_name,
  CASE 
    WHEN can_manage_team(
      (SELECT id FROM teams WHERE name = 'Test Team Founder'),
      '11111111-1111-1111-1111-111111111111'::UUID
    ) THEN 'PASS'
    ELSE 'FAIL - Permessi founder non corretti'
  END as result;

-- Test permessi admin
SELECT 
  'TEST 10 - ADMIN PERMISSIONS' as test_name,
  CASE 
    WHEN can_manage_team(
      (SELECT id FROM teams WHERE name = 'Test Team Founder'),
      '22222222-2222-2222-2222-222222222222'::UUID
    ) THEN 'PASS'
    ELSE 'FAIL - Permessi admin non corretti'
  END as result;

-- Test limitazioni player
SELECT 
  'TEST 11 - PLAYER LIMITATIONS' as test_name,
  CASE 
    WHEN NOT can_manage_team(
      (SELECT id FROM teams WHERE name = 'Test Team Founder'),
      '33333333-3333-3333-3333-333333333333'::UUID
    ) AND can_view_team(
      (SELECT id FROM teams WHERE name = 'Test Team Founder'),
      '33333333-3333-3333-3333-333333333333'::UUID
    ) THEN 'PASS'
    ELSE 'FAIL - Permessi player non corretti'
  END as result;

-- STEP 8: TEST TRASFERIMENTO OWNERSHIP
-- ============================================

-- Test trasferimento founder -> admin
DO $$
DECLARE
  test_team_id UUID;
  test_founder_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  test_admin_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  transfer_result BOOLEAN;
BEGIN
  SELECT id INTO test_team_id FROM teams WHERE name = 'Test Team Founder';
  
  SELECT transfer_team_ownership(
    test_team_id,
    test_admin_id,
    'Test transfer per verifica sistema'
  ) INTO transfer_result;

  RAISE NOTICE 'TEST OWNERSHIP TRANSFER: %', transfer_result;
END $$;

-- Verifica trasferimento
SELECT 
  'TEST 12 - OWNERSHIP TRANSFER' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = '22222222-2222-2222-2222-222222222222'::UUID
      AND role = 'founder'
      AND status = 'active'
    ) AND EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = '11111111-1111-1111-1111-111111111111'::UUID
      AND role = 'admin'
      AND status = 'active'
    ) AND EXISTS (
      SELECT 1 FROM teams 
      WHERE name = 'Test Team Founder'
      AND owner_id = '22222222-2222-2222-2222-222222222222'::UUID
    ) THEN 'PASS'
    ELSE 'FAIL - Trasferimento ownership non funzionante'
  END as result;

-- STEP 9: RISULTATI FINALI
-- ============================================

-- Riepilogo completo stato team test
SELECT 
  'RIEPILOGO TEAM TEST' as section,
  t.name as team_name,
  t.abbreviation,
  t.owner_id,
  (SELECT email FROM auth.users WHERE id = t.owner_id) as owner_email
FROM teams t 
WHERE t.name = 'Test Team Founder';

-- Riepilogo membri team
SELECT 
  'RIEPILOGO MEMBRI' as section,
  tm.role,
  tm.status,
  tm.ea_sports_id,
  u.email
FROM team_members tm
JOIN auth.users u ON u.id = tm.user_id
WHERE tm.team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
ORDER BY 
  CASE tm.role 
    WHEN 'founder' THEN 1 
    WHEN 'admin' THEN 2 
    WHEN 'player' THEN 3 
  END;

-- Riepilogo inviti
SELECT 
  'RIEPILOGO INVITI' as section,
  ti.code,
  ti.role,
  ti.used_count,
  ti.max_uses,
  ti.is_active,
  ti.expires_at
FROM team_invites ti
WHERE ti.team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
ORDER BY ti.role;

-- RISULTATO FINALE
SELECT 
  'RISULTATO FINALE TEST' as section,
  CASE 
    WHEN (
      -- Verifica team creato
      SELECT COUNT(*) FROM teams WHERE name = 'Test Team Founder'
    ) = 1 AND (
      -- Verifica 3 membri (founder trasferito + nuovo founder + player)
      SELECT COUNT(*) FROM team_members 
      WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
      AND status = 'active'
    ) = 3 AND (
      -- Verifica inviti funzionanti
      SELECT COUNT(*) FROM team_invites 
      WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder')
      AND used_count > 0
    ) = 2 THEN '🎉 TUTTI I TEST SUPERATI - SISTEMA FUNZIONANTE!'
    ELSE '❌ ALCUNI TEST FALLITI - VERIFICARE ERRORI SOPRA'
  END as result;

-- PULIZIA FINALE (opzionale - rimuovi se vuoi mantenere i dati di test)
/*
DELETE FROM team_members WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder');
DELETE FROM team_invites WHERE team_id = (SELECT id FROM teams WHERE name = 'Test Team Founder');
DELETE FROM teams WHERE name = 'Test Team Founder';
DELETE FROM auth.users WHERE email LIKE '%test%@example.com';
*/

RAISE NOTICE 'Test sistema registrazione completato!';