-- 🚀 COMPLETE SETUP: RLS + DATA POPULATION
-- This handles everything in one script

BEGIN;

SELECT '🍮 JENNY''S PUDDING COMPLETE SETUP STARTING...' as status;

-- ============================================================================
-- 1. TEMPORARILY DISABLE RLS FOR SEEDING
-- ============================================================================

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hero-banner" DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for seeding...' as status;

-- ============================================================================
-- 2. CLEAR AND SETUP FRESH DATA
-- ============================================================================

TRUNCATE categories, products, "hero-banner" RESTART IDENTITY CASCADE;

-- Insert 13 categories
INSERT INTO categories (name, icon_url) VALUES 
('Pudding Coklat', 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop'),
('Pudding Buah', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'),
('Pudding Vanilla', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop'),
('Pudding Special', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'),
('Pudding Klasik', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'),
('Pudding Premium', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop'),
('Pudding Caramel', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop'),
('Pudding Taro', 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=100&h=100&fit=crop'),
('Pudding Green Tea', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&h=100&fit=crop'),
('Pudding Mix Berry', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop'),
('Pudding Tiramisu', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=100&h=100&fit=crop'),
('Pudding Coconut', 'https://images.unsplash.com/photo-1506732111853-d0a8ac2ce41c?w=100&h=100&fit=crop'),
('Pudding Seasonal', 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=100&h=100&fit=crop');

SELECT 'Categories inserted: ' || (SELECT COUNT(*) FROM categories) as status;

-- ============================================================================
-- 3. INSERT 130 PRODUCTS (10 per category)
-- ============================================================================

-- Pudding Coklat (10 products)
INSERT INTO products (name, price, images, category_id, description, is_popular, is_new, stock_count) VALUES 
('Pudding Coklat Premium Dark', 28000, ARRAY['/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg'], 1, 'Pudding coklat gelap premium dengan rasa coklat Belgium yang kaya dan intens', true, false, 15),
('Pudding Coklat Milk Creamy', 25000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg'], 1, 'Pudding coklat susu dengan tekstur yang lembut dan creamy', false, true, 20),
('Pudding Coklat White Delight', 27000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg'], 1, 'Pudding coklat putih dengan topping almond slice yang renyah', true, false, 18),
('Pudding Coklat Oreo Crunch', 30000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg'], 1, 'Pudding coklat dengan oreo hancur dan whipped cream segar', true, true, 12),
('Pudding Coklat Hazelnut', 32000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg'], 1, 'Pudding coklat dengan selai hazelnut dan kacang cincang', false, false, 25),
('Pudding Coklat Brownies', 35000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg'], 1, 'Pudding coklat dengan potongan brownies fudgy di dalamnya', true, false, 8),
('Pudding Coklat Mocha', 29000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg'], 1, 'Kombinasi coklat dan kopi espresso dalam pudding yang sempurna', false, true, 16),
('Pudding Coklat Mint', 26000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg'], 1, 'Pudding coklat dengan sentuhan mint segar yang menyegarkan', false, false, 22),
('Pudding Coklat Caramel Swirl', 31000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg'], 1, 'Pudding coklat dengan swirl caramel dan garam laut', true, false, 14),
('Pudding Coklat Triple Layer', 38000, ARRAY['/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg'], 1, 'Tiga layer coklat: dark, milk, dan white dalam satu cup', true, true, 10);

SELECT 'Pudding Coklat products added: 10' as status;

-- Pudding Buah (10 products)
INSERT INTO products (name, price, images, category_id, description, is_popular, is_new, stock_count) VALUES 
('Pudding Strawberry Fresh', 24000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg'], 2, 'Pudding strawberry dengan potongan buah strawberry segar', true, false, 18),
('Pudding Mangga Tropical', 26000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg'], 2, 'Pudding mangga manis dengan daging buah mangga asli', true, true, 20),
('Pudding Mix Berry Fusion', 28000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg'], 2, 'Kombinasi strawberry, blueberry, dan raspberry dalam pudding', false, true, 15),
('Pudding Pisang Cavendish', 22000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg'], 2, 'Pudding pisang dengan aroma pisang Cavendish yang harum', false, false, 25),
('Pudding Alpukat Creamy', 25000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg'], 2, 'Pudding alpukat dengan tekstur creamy dan rasa yang unik', true, false, 12),
('Pudding Jeruk Mandarin', 23000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg', '/WhatsApp Image 2025-05-25 at 16.28.18.jpeg'], 2, 'Pudding jeruk mandarin dengan kesegaran citrus alami', false, true, 19),
('Pudding Leci Exotic', 27000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg'], 2, 'Pudding leci dengan aroma dan rasa eksotis yang menyegarkan', false, false, 16),
('Pudding Kiwi Green', 26000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41.jpeg'], 2, 'Pudding kiwi dengan vitamin C tinggi dan rasa asam manis', true, false, 21),
('Pudding Nanas Tropis', 24000, ARRAY['/WhatsApp Image 2025-05-25 at 16.28.18.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.39.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg'], 2, 'Pudding nanas dengan kesegaran tropis yang menyegarkan', false, true, 17),
('Pudding Durian King', 35000, ARRAY['/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.40.jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg', '/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg'], 2, 'Pudding durian premium untuk pencinta buah raja', true, true, 8);

SELECT 'Pudding Buah products added: 10' as status; 