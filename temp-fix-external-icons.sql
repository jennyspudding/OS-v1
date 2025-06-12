-- 🚀 TEMPORARY FIX: Replace external URLs with better fallbacks
-- This provides immediate relief while proper icons are uploaded via admin

BEGIN;

SELECT '🔧 APPLYING TEMPORARY ICON FIXES...' as status;

-- ============================================================================
-- 1. REPLACE EXTERNAL URLS WITH EMOJI/TEXT FALLBACKS
-- ============================================================================

-- Instead of external URLs, we'll clear them so the component shows the emoji fallback
UPDATE categories 
SET icon_url = NULL
WHERE icon_url LIKE 'https://images.unsplash.com%'
   OR icon_url LIKE 'https://%';

SELECT 'Cleared external URLs - will show emoji fallbacks' as status;

-- ============================================================================
-- 2. ENSURE RANKING COLUMN EXISTS AND IS POPULATED
-- ============================================================================

DO $$
BEGIN
    -- Add ranking column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'ranking'
    ) THEN
        ALTER TABLE categories ADD COLUMN ranking INTEGER DEFAULT 0;
    END IF;
    
    -- Update ranking for all categories
    UPDATE categories SET ranking = subq.new_ranking
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) as new_ranking
        FROM categories
    ) subq
    WHERE categories.id = subq.id;
END $$;

SELECT 'Updated category rankings' as status;

-- ============================================================================
-- 3. VERIFY RESULTS
-- ============================================================================

SELECT 'Current category state:' as verification;

SELECT 
    id,
    name,
    CASE 
        WHEN icon_url IS NULL THEN '🍮 Emoji fallback'
        WHEN icon_url LIKE 'data:image%' THEN '✅ Admin uploaded'
        ELSE '⚠️ External URL'
    END as icon_status,
    ranking
FROM categories 
ORDER BY ranking, id;

SELECT 'Total categories: ' || COUNT(*) as summary FROM categories;

SELECT '✅ Temporary fixes applied! Now upload proper icons via admin panel.' as status;

COMMIT; 