-- Migration: Add Express Store functionality
-- This script adds columns to existing tables to support same-day delivery from physical store

-- 1. Add Express columns to products table
ALTER TABLE products 
ADD COLUMN is_express_item boolean DEFAULT false NOT NULL,
ADD COLUMN express_stock_quantity integer DEFAULT 0 NOT NULL;

-- Create index for better performance when querying express items
CREATE INDEX idx_products_is_express_item ON products(is_express_item) WHERE is_express_item = true;

-- 2. Add Express order flag to orders table
ALTER TABLE orders 
ADD COLUMN is_express_order boolean DEFAULT false NOT NULL;

-- Create index for better performance when filtering express orders
CREATE INDEX idx_orders_is_express_order ON orders(is_express_order) WHERE is_express_order = true;

-- 3. Update RLS (Row Level Security) policies for products table
-- Allow anyone to view products (including express items)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT
    USING (true);

-- Allow only authenticated admin users to INSERT products
DROP POLICY IF EXISTS "Admin can insert products" ON products;
CREATE POLICY "Admin can insert products" ON products
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    );

-- Allow only authenticated admin users to UPDATE products (including express fields)
DROP POLICY IF EXISTS "Admin can update products" ON products;
CREATE POLICY "Admin can update products" ON products
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    );

-- Allow only authenticated admin users to DELETE products
DROP POLICY IF EXISTS "Admin can delete products" ON products;
CREATE POLICY "Admin can delete products" ON products
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    );

-- 4. Update RLS policies for orders table to handle express orders
-- Allow public to view orders (since the app doesn't use user authentication for customers)
DROP POLICY IF EXISTS "Allow public to read orders" ON orders;
CREATE POLICY "Allow public to read orders" ON orders
    FOR SELECT
    USING (true);

-- Allow public to create orders (both regular and express)
DROP POLICY IF EXISTS "Allow public to insert orders" ON orders;
CREATE POLICY "Allow public to insert orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- Allow public to update orders (for payment uploads, etc.)
DROP POLICY IF EXISTS "Allow public to update orders" ON orders;
CREATE POLICY "Allow public to update orders" ON orders
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow admin users to have full access to orders
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
CREATE POLICY "Admin full access to orders" ON orders
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@jennys-pudding.com',
                'jenny@jennys-pudding.com',
                'manager@jennys-pudding.com'
            )
        )
    );

-- 5. Create a function to get available express products
CREATE OR REPLACE FUNCTION get_express_products()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    image_url text,
    category_id uuid,
    express_stock_quantity integer,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category_id,
        p.express_stock_quantity,
        p.created_at,
        p.updated_at
    FROM products p
    WHERE p.is_express_item = true 
    AND p.express_stock_quantity > 0
    ORDER BY p.name;
$$;

-- 6. Create a function to update express stock when order is placed
CREATE OR REPLACE FUNCTION update_express_stock(
    product_id uuid,
    quantity_ordered integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if enough stock is available
    IF (SELECT express_stock_quantity FROM products WHERE id = product_id AND is_express_item = true) >= quantity_ordered THEN
        -- Update the stock
        UPDATE products 
        SET express_stock_quantity = express_stock_quantity - quantity_ordered,
            updated_at = now()
        WHERE id = product_id AND is_express_item = true;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- 7. Create a function to get express orders for admin dashboard
CREATE OR REPLACE FUNCTION get_express_orders()
RETURNS TABLE (
    id uuid,
    order_id varchar,
    customer_name varchar,
    customer_phone varchar,
    full_address text,
    total_amount integer,
    status order_status,
    created_at timestamptz,
    requested_delivery_time timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        o.id,
        o.order_id,
        o.customer_name,
        o.customer_phone,
        o.full_address,
        o.total_amount,
        o.status,
        o.created_at,
        o.requested_delivery_time
    FROM orders o
    WHERE o.is_express_order = true
    ORDER BY o.created_at DESC;
$$;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_express_products() TO public;
GRANT EXECUTE ON FUNCTION get_express_products() TO authenticated;
GRANT EXECUTE ON FUNCTION update_express_stock(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION update_express_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_express_orders() TO authenticated;

-- 9. Add comments for documentation
COMMENT ON COLUMN products.is_express_item IS 'Flag indicating if this product is available for same-day express delivery from physical store';
COMMENT ON COLUMN products.express_stock_quantity IS 'Current stock quantity available for express delivery';
COMMENT ON COLUMN orders.is_express_order IS 'Flag indicating if this order is for express same-day delivery';

-- 10. Create sample data for testing (optional - remove in production)
-- Insert a few products as express items for testing
-- UPDATE products 
-- SET is_express_item = true, express_stock_quantity = 10 
-- WHERE name ILIKE '%pudding%' 
-- LIMIT 3;

COMMIT; 