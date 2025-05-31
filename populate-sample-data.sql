-- 🚀 POPULATE SAMPLE DATA FOR JENNY'S PUDDING STORE
-- Run this in your Supabase SQL Editor to get your store working immediately

BEGIN;

SELECT '🍮 Creating sample data for Jenny''s Pudding store...' as status;

-- ============================================================================
-- 1. INSERT SAMPLE CATEGORIES
-- ============================================================================

INSERT INTO categories (id, name, icon_url) VALUES 
(1, 'Pudding Coklat', 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop'),
(2, 'Pudding Buah', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop'),
(3, 'Pudding Vanilla', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop'),
(4, 'Pudding Special', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop'),
(5, 'Pudding Klasik', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'),
(6, 'Pudding Premium', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url;

SELECT 'Categories inserted!' as status;

-- ============================================================================
-- 2. INSERT SAMPLE PRODUCTS
-- ============================================================================

INSERT INTO products (id, name, price, images, category_id, description, is_popular, is_new, stock_count) VALUES 
(1, 'Pudding Coklat Premium', 25000, ARRAY[
  'https://images.unsplash.com/photo-1541599468348-e96984315921?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop'
], 1, 'Pudding coklat premium dengan rasa yang kaya dan tekstur lembut', true, false, 15),

(2, 'Pudding Strawberry Delight', 22000, ARRAY[
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&h=400&fit=crop'
], 2, 'Pudding strawberry segar dengan potongan buah asli', false, true, 20),

(3, 'Pudding Vanilla Classic', 20000, ARRAY[
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop'
], 3, 'Pudding vanilla klasik dengan aroma vanilla asli', false, false, 25),

(4, 'Pudding Mangga Tropical', 24000, ARRAY[
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560781290-7dc94c0f8f4f?w=400&h=400&fit=crop'
], 2, 'Pudding mangga tropical dengan rasa segar dan manis', true, false, 18),

(5, 'Pudding Oreo Crunch', 28000, ARRAY[
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop'
], 1, 'Pudding coklat dengan oreo crunch dan whipped cream', true, true, 12),

(6, 'Pudding Caramel Delight', 26000, ARRAY[
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop'
], 4, 'Pudding caramel dengan saus caramel house special', false, true, 16),

(7, 'Pudding Taro Purple', 23000, ARRAY[
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=400&h=400&fit=crop'
], 5, 'Pudding taro ungu dengan rasa otentik dan tekstur creamy', false, false, 22),

(8, 'Pudding Tiramisu Special', 32000, ARRAY[
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1594736797933-d0a9ba7ae65a?w=400&h=400&fit=crop'
], 6, 'Pudding tiramisu premium dengan layer coffee dan mascarpone', true, true, 8),

(9, 'Pudding Green Tea Matcha', 27000, ARRAY[
  'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop'
], 5, 'Pudding green tea matcha premium dengan rasa autentik Jepang', false, true, 14),

(10, 'Pudding Mix Berry Fusion', 29000, ARRAY[
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop'
], 2, 'Pudding mix berry dengan blueberry, strawberry, dan raspberry', true, false, 19)

ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  images = EXCLUDED.images,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description,
  is_popular = EXCLUDED.is_popular,
  is_new = EXCLUDED.is_new,
  stock_count = EXCLUDED.stock_count;

SELECT 'Products inserted!' as status;

-- ============================================================================
-- 3. INSERT SAMPLE HERO BANNERS
-- ============================================================================

INSERT INTO "hero-banner" (id, text, image) VALUES 
(1, 'Pudding Coklat Premium - Rasa Terbaik!', 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=800&h=400&fit=crop'),
(2, 'Pudding Buah Segar - Langsung dari Kebun!', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop'),
(3, 'Koleksi Pudding Premium - Limited Edition!', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=400&fit=crop')
ON CONFLICT (id) DO UPDATE SET 
  text = EXCLUDED.text,
  image = EXCLUDED.image;

SELECT 'Hero banners inserted!' as status;

-- ============================================================================
-- 4. VERIFY DATA
-- ============================================================================

SELECT 'Verification Results:' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_banners FROM "hero-banner";

SELECT '🎉 Sample data populated successfully! Your store should now work!' as status;

COMMIT; 