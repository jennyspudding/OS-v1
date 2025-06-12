-- 🔧 FIX CATEGORY ICONS LOADING ISSUES
-- This script addresses several issues with category icon loading

BEGIN;

SELECT '🍮 FIXING CATEGORY ICON LOADING ISSUES...' as status;

-- ============================================================================
-- 1. CHECK AND ADD MISSING RANKING COLUMN
-- ============================================================================

-- Check if ranking column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'ranking'
    ) THEN
        -- Add ranking column
        ALTER TABLE categories ADD COLUMN ranking INTEGER DEFAULT 0;
        SELECT 'Added ranking column to categories table' as status;
    ELSE
        SELECT 'Ranking column already exists' as status;
    END IF;
END $$;

-- ============================================================================
-- 2. UPDATE EXISTING CATEGORIES WITH RANKING VALUES
-- ============================================================================

-- Update categories with proper ranking based on their current order
UPDATE categories SET ranking = subq.new_ranking
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as new_ranking
    FROM categories
) subq
WHERE categories.id = subq.id;

SELECT 'Updated category rankings' as status;

-- ============================================================================
-- 3. VERIFY CATEGORY ICON URLS ARE VALID
-- ============================================================================

-- Check for categories without icon URLs
UPDATE categories 
SET icon_url = CASE 
    WHEN name ILIKE '%coklat%' THEN 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop'
    WHEN name ILIKE '%buah%' OR name ILIKE '%fruit%' THEN 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'
    WHEN name ILIKE '%vanilla%' THEN 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop'
    WHEN name ILIKE '%special%' THEN 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'
    WHEN name ILIKE '%klasik%' THEN 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'
    WHEN name ILIKE '%premium%' THEN 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop'
    WHEN name ILIKE '%caramel%' THEN 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop'
    WHEN name ILIKE '%taro%' THEN 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=100&h=100&fit=crop'
    WHEN name ILIKE '%green tea%' OR name ILIKE '%matcha%' THEN 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&h=100&fit=crop'
    WHEN name ILIKE '%berry%' THEN 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop'
    WHEN name ILIKE '%tiramisu%' THEN 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=100&h=100&fit=crop'
    WHEN name ILIKE '%coconut%' THEN 'https://images.unsplash.com/photo-1506732111853-d0a8ac2ce41c?w=100&h=100&fit=crop'
    WHEN name ILIKE '%loyang%' THEN 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop'
    WHEN name ILIKE '%tumpeng%' THEN 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'
    WHEN name ILIKE '%cup%' THEN 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop'
    WHEN name ILIKE '%oriental%' THEN 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'
    WHEN name ILIKE '%tart%' THEN 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'
    WHEN name ILIKE '%moon%' THEN 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop'
    WHEN name ILIKE '%brownie%' THEN 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&h=100&fit=crop'
    ELSE 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'
END
WHERE icon_url IS NULL OR icon_url = '';

SELECT 'Updated missing category icon URLs' as status;

-- ============================================================================
-- 4. VERIFY FINAL STATE
-- ============================================================================

SELECT 'Final verification:' as status;
SELECT 
    id,
    name,
    CASE 
        WHEN icon_url IS NOT NULL THEN 'Has icon'
        ELSE 'Missing icon'
    END as icon_status,
    ranking
FROM categories 
ORDER BY ranking, id;

SELECT 'Total categories: ' || COUNT(*) || ' | With icons: ' || COUNT(icon_url) as summary
FROM categories;

SELECT '✅ Category icon fixes completed!' as status;

COMMIT; 