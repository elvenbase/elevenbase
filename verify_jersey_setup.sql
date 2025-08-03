-- ============================================================================
-- VERIFICATION SCRIPT FOR JERSEY TEMPLATES SYSTEM
-- ============================================================================
-- Run this script to verify that everything is set up correctly
-- ============================================================================

-- 1. Check if jersey_templates table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'jersey_templates'
        ) 
        THEN '✅ Tabella jersey_templates esiste'
        ELSE '❌ Tabella jersey_templates NON esiste'
    END as table_status;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'jersey_templates'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'jersey_templates' 
            AND rowsecurity = true
        ) 
        THEN '✅ RLS è abilitato'
        ELSE '❌ RLS NON è abilitato'
    END as rls_status;

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'jersey_templates'
ORDER BY policyname;

-- 5. Check if trigger exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_trigger 
            WHERE tgname = 'set_updated_at_jersey_templates'
        ) 
        THEN '✅ Trigger set_updated_at_jersey_templates esiste'
        ELSE '❌ Trigger set_updated_at_jersey_templates NON esiste'
    END as trigger_status;

-- 6. Check if storage bucket exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM storage.buckets 
            WHERE id = 'jerseys'
        ) 
        THEN '✅ Storage bucket jerseys esiste'
        ELSE '❌ Storage bucket jerseys NON esiste'
    END as bucket_status;

-- 7. Check storage bucket details
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'jerseys';

-- 8. Check storage policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND qual LIKE '%jerseys%'
ORDER BY policyname;

-- 9. Check if default jersey template exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM jersey_templates 
            WHERE is_default = true
        ) 
        THEN '✅ Template di default esiste'
        ELSE '❌ Template di default NON esiste'
    END as default_template_status;

-- 10. Show all jersey templates
SELECT 
    id,
    name,
    description,
    image_url,
    is_default,
    created_at,
    updated_at,
    created_by
FROM jersey_templates
ORDER BY is_default DESC, created_at DESC;

-- 11. Check index
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'jersey_templates' 
            AND indexname = 'idx_jersey_templates_default'
        ) 
        THEN '✅ Indice idx_jersey_templates_default esiste'
        ELSE '❌ Indice idx_jersey_templates_default NON esiste'
    END as index_status;

-- 12. Summary
SELECT 
    'VERIFICA COMPLETATA' as status,
    COUNT(*) as total_templates,
    SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as default_templates
FROM jersey_templates;