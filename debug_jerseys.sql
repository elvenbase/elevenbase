-- ============================================================================
-- DEBUG SCRIPT FOR JERSEY TEMPLATES
-- ============================================================================
-- Run this to see what's in the jersey_templates table
-- ============================================================================

-- Check all jersey templates
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
ORDER BY created_at DESC;

-- Count total templates
SELECT 
    COUNT(*) as total_templates,
    SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as default_templates,
    COUNT(DISTINCT name) as unique_names
FROM jersey_templates;

-- Check for duplicates by name
SELECT 
    name,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM jersey_templates
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check recent activity
SELECT 
    'Last 24 hours' as period,
    COUNT(*) as templates_created
FROM jersey_templates
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Last hour' as period,
    COUNT(*) as templates_created
FROM jersey_templates
WHERE created_at >= NOW() - INTERVAL '1 hour';