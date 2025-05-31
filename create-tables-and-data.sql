-- 🛠️ COMPLETE TABLE CREATION AND DATA POPULATION
-- Run this if you're unsure about table structure

BEGIN;

SELECT '🔧 Ensuring tables exist with correct structure...' as status;

-- ============================================================================
-- 1. CREATE TABLES IF THEY DON'T EXIST
-- ============================================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    images TEXT[] DEFAULT '{}',
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_promo BOOLEAN DEFAULT false,
    stock_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hero banner table
CREATE TABLE IF NOT EXISTS "hero-banner" (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Tables created/verified!' as status;

-- ============================================================================
-- 2. DISABLE RLS ON PUBLIC TABLES (IMPORTANT!)
-- ============================================================================

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hero-banner" DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled on public tables!' as status;

-- ============================================================================
-- 3. CLEAR EXISTING DATA AND INSERT FRESH DATA
-- ============================================================================

TRUNCATE categories, products, "hero-banner" RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (name, icon_url) VALUES 
('Pudding Coklat', 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop'),
('Pudding Buah', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'),
('Pudding Vanilla', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop'),
('Pudding Special', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'),
('Pudding Klasik', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'),
('Pudding Premium', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop');

-- Insert products
INSERT INTO products (name, price, images, category_id, description, is_popular, is_new, stock_count) VALUES 
('Pudding Coklat Premium', 25000, ARRAY[
  'https://images.unsplash.com/photo-1541599468348-e96984315921?w=400&h=400&fit=crop'
], 1, 'Pudding coklat premium dengan rasa yang kaya', true, false, 15),

('Pudding Strawberry', 22000, ARRAY[
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop'
], 2, 'Pudding strawberry segar', false, true, 20),

('Pudding Vanilla Classic', 20000, ARRAY[
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop'
], 3, 'Pudding vanilla klasik', false, false, 25),

('Pudding Mangga', 24000, ARRAY[
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop'
], 2, 'Pudding mangga tropical', true, false, 18),

('Pudding Oreo Crunch', 28000, ARRAY[
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400&fit=crop'
], 1, 'Pudding coklat dengan oreo crunch', true, true, 12),

('Pudding Caramel', 26000, ARRAY[
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop'
], 4, 'Pudding caramel house special', false, true, 16),

('Pudding Taro', 23000, ARRAY[
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop'
], 5, 'Pudding taro ungu creamy', false, false, 22),

('Pudding Tiramisu', 32000, ARRAY[
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop'
], 6, 'Pudding tiramisu premium', true, true, 8);

-- Insert hero banners
INSERT INTO "hero-banner" (text, image) VALUES 
('Pudding Coklat Premium - Rasa Terbaik!', 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=800&h=400&fit=crop'),
('Pudding Buah Segar - Langsung dari Kebun!', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop'),
('Koleksi Pudding Premium - Limited Edition!', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=400&fit=crop');

-- ============================================================================
-- 4. VERIFY EVERYTHING IS WORKING
-- ============================================================================

SELECT 'FINAL VERIFICATION:' as status;
SELECT 'Categories count: ' || COUNT(*) FROM categories;
SELECT 'Products count: ' || COUNT(*) FROM products;
SELECT 'Banners count: ' || COUNT(*) FROM "hero-banner";

-- Show sample data
SELECT 'Sample categories:' as status;
SELECT id, name, icon_url FROM categories LIMIT 3;

SELECT 'Sample products:' as status;
SELECT id, name, price, array_length(images, 1) as image_count FROM products LIMIT 3;

SELECT '🎉🍮 JENNY''S PUDDING STORE IS NOW READY! 🍮🎉' as status;

COMMIT; 