-- 🚨 IMMEDIATE FIX: Allow public access to categories and products
-- Run this in your Supabase SQL Editor

BEGIN;

SELECT '🔧 Fixing public access to categories and products...' as status;

-- ============================================================================
-- 1. FIX CATEGORIES TABLE - Allow public read access
-- ============================================================================

-- Drop existing restrictive policies on categories
DROP POLICY IF EXISTS "secure_categories_select" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_read_policy" ON categories;

-- Create public read policy for categories
CREATE POLICY "public_categories_read" ON categories
    FOR SELECT
    TO public
    USING (true);

SELECT 'Categories table now allows public read access!' as status;

-- ============================================================================
-- 2. FIX PRODUCTS TABLE - Allow public read access
-- ============================================================================

-- Drop existing restrictive policies on products
DROP POLICY IF EXISTS "secure_products_select" ON products;
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_read_policy" ON products;

-- Create public read policy for products
CREATE POLICY "public_products_read" ON products
    FOR SELECT
    TO public
    USING (true);

SELECT 'Products table now allows public read access!' as status;

-- ============================================================================
-- 3. FIX HERO-BANNER TABLE - Allow public read access
-- ============================================================================

-- Drop existing restrictive policies on hero-banner
DROP POLICY IF EXISTS "secure_hero_banner_select" ON "hero-banner";
DROP POLICY IF EXISTS "hero_banner_select_policy" ON "hero-banner";
DROP POLICY IF EXISTS "hero_banner_read_policy" ON "hero-banner";

-- Create public read policy for hero-banner
CREATE POLICY "public_hero_banner_read" ON "hero-banner"
    FOR SELECT
    TO public
    USING (true);

SELECT 'Hero-banner table now allows public read access!' as status;

-- ============================================================================
-- 4. VERIFY POLICIES ARE WORKING
-- ============================================================================

-- Test that we can read from these tables
SELECT 'Testing categories access...' as status;
SELECT COUNT(*) as category_count FROM categories;

SELECT 'Testing products access...' as status;
SELECT COUNT(*) as product_count FROM products;

SELECT 'Testing hero-banner access...' as status;
SELECT COUNT(*) as banner_count FROM "hero-banner";

SELECT '✅ Public access fix completed successfully!' as status;

COMMIT; 