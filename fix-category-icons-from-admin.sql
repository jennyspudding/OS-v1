-- 🔧 FIX CATEGORY ICONS FROM ADMIN UPLOADS
-- This script checks the current category icon state and provides guidance

BEGIN;

SELECT '🍮 CHECKING CATEGORY ICON STATE...' as status;

-- ============================================================================
-- 1. CHECK CURRENT CATEGORY ICON TYPES
-- ============================================================================

SELECT 'Current category icon analysis:' as analysis;

SELECT 
    id,
    name,
    CASE 
        WHEN icon_url IS NULL THEN 'No icon'
        WHEN icon_url LIKE 'data:image%' THEN 'Base64 admin upload ✅'
        WHEN icon_url LIKE 'https://images.unsplash.com%' THEN 'External Unsplash URL ⚠️'
        WHEN icon_url LIKE 'https://%' THEN 'Other external URL ⚠️'
        ELSE 'Unknown URL type'
    END as icon_type,
    CASE 
        WHEN icon_url IS NULL THEN 0
        WHEN icon_url LIKE 'data:image%' THEN LENGTH(icon_url)
        ELSE 0
    END as base64_size,
    ranking
FROM categories 
ORDER BY ranking NULLS LAST, id;

-- ============================================================================
-- 2. ADD RANKING COLUMN IF MISSING
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'ranking'
    ) THEN
        ALTER TABLE categories ADD COLUMN ranking INTEGER DEFAULT 0;
        
        -- Set ranking based on current order
        UPDATE categories SET ranking = subq.new_ranking
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id) as new_ranking
            FROM categories
        ) subq
        WHERE categories.id = subq.id;
        
        SELECT 'Added ranking column and set values' as status;
    ELSE
        -- Update ranking for categories that don't have it set
        UPDATE categories SET ranking = subq.new_ranking
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id) as new_ranking
            FROM categories
            WHERE ranking IS NULL OR ranking = 0
        ) subq
        WHERE categories.id = subq.id AND (categories.ranking IS NULL OR categories.ranking = 0);
        
        SELECT 'Updated missing ranking values' as status;
    END IF;
END $$;

-- ============================================================================
-- 3. SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT 'Icon type summary:' as summary;

SELECT 
    CASE 
        WHEN icon_url IS NULL THEN 'No icon'
        WHEN icon_url LIKE 'data:image%' THEN 'Admin uploaded (base64)'
        WHEN icon_url LIKE 'https://images.unsplash.com%' THEN 'External Unsplash'
        WHEN icon_url LIKE 'https://%' THEN 'Other external'
        ELSE 'Unknown'
    END as icon_type,
    COUNT(*) as count
FROM categories 
GROUP BY 
    CASE 
        WHEN icon_url IS NULL THEN 'No icon'
        WHEN icon_url LIKE 'data:image%' THEN 'Admin uploaded (base64)'
        WHEN icon_url LIKE 'https://images.unsplash.com%' THEN 'External Unsplash'
        WHEN icon_url LIKE 'https://%' THEN 'Other external'
        ELSE 'Unknown'
    END
ORDER BY count DESC;

SELECT '📋 RECOMMENDATIONS:' as recommendations;

-- Check if we have any external URLs that should be replaced
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM categories WHERE icon_url LIKE 'https://%') THEN
            '⚠️  You have external URLs for category icons. These should be replaced with admin-uploaded icons via your admin panel.'
        WHEN EXISTS (SELECT 1 FROM categories WHERE icon_url IS NULL) THEN
            '📝 You have categories without icons. Upload icons via your admin panel.'
        ELSE
            '✅ All categories have proper admin-uploaded icons!'
    END as recommendation;

SELECT '🔧 TO FIX:' as instructions;
SELECT '1. Go to your admin panel' as step_1;
SELECT '2. Navigate to Categories section' as step_2;
SELECT '3. For each category, upload a proper icon image' as step_3;
SELECT '4. The icons will be automatically converted to base64 and stored in the database' as step_4;
SELECT '5. Refresh your frontend to see the changes' as step_5;

SELECT '✅ Category icon analysis completed!' as status;

COMMIT; 