-- 🔒 RE-ENABLE RLS WITH PROPER PUBLIC ACCESS
-- Run this in your Supabase SQL Editor

BEGIN;

SELECT '🔒 Re-enabling RLS with proper public access policies...' as status;

-- ============================================================================
-- 1. ENABLE RLS ON PUBLIC TABLES
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hero-banner" ENABLE ROW LEVEL SECURITY;

SELECT 'RLS enabled on public tables!' as status;

-- ============================================================================
-- 2. CREATE PUBLIC READ POLICIES (ALLOW EVERYONE TO READ)
-- ============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "public_categories_read" ON categories;
DROP POLICY IF EXISTS "public_products_read" ON products;
DROP POLICY IF EXISTS "public_hero_banner_read" ON "hero-banner";

-- Categories - Public read access
CREATE POLICY "public_categories_read" ON categories
    FOR SELECT
    TO public
    USING (true);

-- Products - Public read access
CREATE POLICY "public_products_read" ON products
    FOR SELECT
    TO public
    USING (true);

-- Hero banners - Public read access
CREATE POLICY "public_hero_banner_read" ON "hero-banner"
    FOR SELECT
    TO public
    USING (true);

SELECT 'Public read policies created!' as status;

-- ============================================================================
-- 3. VERIFY POLICIES ARE WORKING
-- ============================================================================

-- Test that we can still read from these tables
SELECT 'Testing public access...' as status;
SELECT 'Categories accessible: ' || (COUNT(*) > 0) FROM categories;
SELECT 'Products accessible: ' || (COUNT(*) > 0) FROM products;
SELECT 'Banners accessible: ' || (COUNT(*) > 0) FROM "hero-banner";

SELECT '✅ RLS re-enabled with proper public access!' as status;

COMMIT; 