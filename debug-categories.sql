-- Debug: Check current categories table structure and data
SELECT '=== CATEGORIES TABLE DEBUG ===' as debug_info;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

SELECT '=== CURRENT CATEGORIES DATA ===' as debug_info;

-- Check current data (first try all columns)
SELECT * FROM categories LIMIT 5;

SELECT '=== ICON URL ANALYSIS ===' as debug_info;

-- Analyze icon URLs
SELECT 
    id,
    name,
    CASE 
        WHEN icon_url IS NULL THEN 'NULL'
        WHEN icon_url = '' THEN 'EMPTY'
        WHEN LENGTH(icon_url) < 50 THEN 'SHORT: ' || icon_url
        WHEN icon_url LIKE 'data:image%' THEN 'BASE64 (' || LENGTH(icon_url) || ' chars)'
        WHEN icon_url LIKE 'https://%' THEN 'EXTERNAL: ' || LEFT(icon_url, 50) || '...'
        ELSE 'OTHER: ' || LEFT(icon_url, 50) || '...'
    END as icon_analysis
FROM categories
ORDER BY id; 