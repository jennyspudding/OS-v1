-- Test Express Store Migration
-- Run this after the main migration to verify everything works

-- 1. Check if new columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('is_express_item', 'express_stock_quantity')
ORDER BY column_name;

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'is_express_order'
ORDER BY column_name;

-- 2. Check if indexes were created
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'orders') 
AND indexname LIKE '%express%';

-- 3. Check if functions were created
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_express_products', 'update_express_stock', 'get_express_orders')
ORDER BY routine_name;

-- 4. Test the functions (this will work even with no data)
SELECT 'Testing get_express_products()' as test_name;
SELECT * FROM get_express_products() LIMIT 5;

SELECT 'Testing get_express_orders()' as test_name;
SELECT * FROM get_express_orders() LIMIT 5;

-- 5. Test adding some sample express products (optional)
-- INSERT INTO products (name, description, price, is_express_item, express_stock_quantity)
-- VALUES 
--     ('Express Pudding Coklat', 'Pudding coklat tersedia hari ini', 25000, true, 10),
--     ('Express Pudding Vanilla', 'Pudding vanilla tersedia hari ini', 25000, true, 8)
-- ON CONFLICT DO NOTHING;

-- 6. Verify RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('products', 'orders')
ORDER BY tablename, policyname;

-- Success message
SELECT 'Express Store migration completed successfully!' as status; 