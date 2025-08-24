-- ============================================
-- BACKUP SCRIPT - EXPORT DATA BEFORE MIGRATION
-- Date: 2025-01-24
-- ============================================

-- Questo script crea tabelle di backup con prefisso backup_
-- Puoi eseguirlo su Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE BACKUP SCHEMA
-- ============================================

CREATE SCHEMA IF NOT EXISTS backup_20250124;

-- ============================================
-- STEP 2: BACKUP IMPORTANT TABLES
-- ============================================

-- Backup players
CREATE TABLE backup_20250124.players AS 
SELECT * FROM public.players;

-- Backup user_roles
CREATE TABLE backup_20250124.user_roles AS 
SELECT * FROM public.user_roles;

-- Backup profiles
CREATE TABLE backup_20250124.profiles AS 
SELECT * FROM public.profiles;

-- Backup training_sessions (anche se le elimineremo)
CREATE TABLE backup_20250124.training_sessions AS 
SELECT * FROM public.training_sessions;

-- Backup matches (anche se le elimineremo)
CREATE TABLE backup_20250124.matches AS 
SELECT * FROM public.matches;

-- Backup competitions
CREATE TABLE backup_20250124.competitions AS 
SELECT * FROM public.competitions;

-- Backup trialists
CREATE TABLE backup_20250124.trialists AS 
SELECT * FROM public.trialists;

-- Backup app_settings
CREATE TABLE backup_20250124.app_settings AS 
SELECT * FROM public.app_settings
WHERE EXISTS (SELECT 1 FROM public.app_settings LIMIT 1);

-- Backup jersey_templates
CREATE TABLE backup_20250124.jersey_templates AS 
SELECT * FROM public.jersey_templates
WHERE EXISTS (SELECT 1 FROM public.jersey_templates LIMIT 1);

-- Backup custom_formations
CREATE TABLE backup_20250124.custom_formations AS 
SELECT * FROM public.custom_formations
WHERE EXISTS (SELECT 1 FROM public.custom_formations LIMIT 1);

-- ============================================
-- STEP 3: CREATE METADATA TABLE
-- ============================================

CREATE TABLE backup_20250124.backup_metadata (
  id SERIAL PRIMARY KEY,
  backup_date TIMESTAMPTZ DEFAULT NOW(),
  table_name TEXT,
  row_count INTEGER
);

-- Insert metadata
INSERT INTO backup_20250124.backup_metadata (table_name, row_count)
SELECT 'players', COUNT(*) FROM backup_20250124.players
UNION ALL
SELECT 'user_roles', COUNT(*) FROM backup_20250124.user_roles
UNION ALL
SELECT 'profiles', COUNT(*) FROM backup_20250124.profiles
UNION ALL
SELECT 'training_sessions', COUNT(*) FROM backup_20250124.training_sessions
UNION ALL
SELECT 'matches', COUNT(*) FROM backup_20250124.matches
UNION ALL
SELECT 'competitions', COUNT(*) FROM backup_20250124.competitions
UNION ALL
SELECT 'trialists', COUNT(*) FROM backup_20250124.trialists;

-- ============================================
-- STEP 4: VERIFY BACKUP
-- ============================================

SELECT 
  table_name,
  row_count,
  backup_date
FROM backup_20250124.backup_metadata
ORDER BY table_name;

-- ============================================
-- HOW TO RESTORE (if needed)
-- ============================================

-- Per ripristinare, usa questi comandi:
-- TRUNCATE public.players CASCADE;
-- INSERT INTO public.players SELECT * FROM backup_20250124.players;
-- (ripeti per ogni tabella necessaria)