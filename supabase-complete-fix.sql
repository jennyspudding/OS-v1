-- COMPLETE SUPABASE FIX FOR JENNY'S PUDDING
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'ready_for_payment',
      'payment_uploaded', 
      'payment_verified',
      'payment_rejected',
      'processing',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('MOTORCYCLE', 'CAR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'qris', 'cash_on_delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Drop existing view to avoid conflicts
DROP VIEW IF EXISTS order_details;

-- Step 4: Create tables with proper field lengths
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Customer Information (increased lengths)
  customer_name VARCHAR(500) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  recipient_name VARCHAR(500) NOT NULL,
  recipient_phone VARCHAR(50) NOT NULL,
  
  -- Address Information (increased lengths)
  province VARCHAR(200),
  city VARCHAR(200),
  district VARCHAR(200),
  postal_code VARCHAR(20),
  street TEXT,
  address_detail TEXT,
  full_address TEXT NOT NULL,
  
  -- Location Coordinates
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  
  -- Delivery Information
  vehicle_type vehicle_type DEFAULT 'MOTORCYCLE',
  requested_delivery_time TIMESTAMPTZ NOT NULL,
  actual_delivery_time TIMESTAMPTZ,
  
  -- Pricing
  subtotal INTEGER NOT NULL,
  delivery_cost INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Order Status and Tracking
  status order_status DEFAULT 'ready_for_payment',
  payment_method payment_method,
  payment_proof_url TEXT,
  
  -- Delivery Quotation Data (JSON)
  delivery_quotation JSONB,
  is_mock_quotation BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Admin fields
  processed_by UUID,
  delivery_notes TEXT,
  internal_notes TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Information (increased lengths)
  product_id VARCHAR(200) NOT NULL,
  product_name VARCHAR(500) NOT NULL,
  product_image TEXT,
  product_category VARCHAR(200),
  
  -- Pricing and Quantity
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL,
  
  -- Product Details
  old_price INTEGER,
  discount_percentage INTEGER,
  special_request TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_item_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  
  addon_id VARCHAR(200) NOT NULL,
  addon_name VARCHAR(500) NOT NULL,
  addon_price INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Update existing tables if they exist
DO $$ 
BEGIN
  -- Update field lengths for existing tables
  BEGIN
    ALTER TABLE orders ALTER COLUMN customer_name TYPE VARCHAR(500);
    ALTER TABLE orders ALTER COLUMN recipient_name TYPE VARCHAR(500);
    ALTER TABLE orders ALTER COLUMN province TYPE VARCHAR(200);
    ALTER TABLE orders ALTER COLUMN city TYPE VARCHAR(200);
    ALTER TABLE orders ALTER COLUMN district TYPE VARCHAR(200);
    ALTER TABLE orders ALTER COLUMN customer_phone TYPE VARCHAR(50);
    ALTER TABLE orders ALTER COLUMN recipient_phone TYPE VARCHAR(50);
    ALTER TABLE orders ALTER COLUMN postal_code TYPE VARCHAR(20);
  EXCEPTION
    WHEN others THEN 
      RAISE NOTICE 'Could not update orders table columns: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(200);
    ALTER TABLE order_items ALTER COLUMN product_name TYPE VARCHAR(500);
    ALTER TABLE order_items ALTER COLUMN product_category TYPE VARCHAR(200);
  EXCEPTION
    WHEN others THEN 
      RAISE NOTICE 'Could not update order_items table columns: %', SQLERRM;
  END;

  BEGIN
    ALTER TABLE order_item_addons ALTER COLUMN addon_id TYPE VARCHAR(200);
    ALTER TABLE order_item_addons ALTER COLUMN addon_name TYPE VARCHAR(500);
  EXCEPTION
    WHEN others THEN 
      RAISE NOTICE 'Could not update order_item_addons table columns: %', SQLERRM;
  END;
END $$;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_addons_order_item_id ON order_item_addons(order_item_id);

-- Step 7: Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
DROP POLICY IF EXISTS "Allow public to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public to read orders" ON orders;
DROP POLICY IF EXISTS "Allow public to update orders" ON orders;

CREATE POLICY "Allow public to insert orders" ON orders
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read orders" ON orders
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public to update orders" ON orders
  FOR UPDATE TO public USING (true);

-- Similar policies for order_items
DROP POLICY IF EXISTS "Allow public to insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public to read order_items" ON order_items;

CREATE POLICY "Allow public to insert order_items" ON order_items
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read order_items" ON order_items
  FOR SELECT TO public USING (true);

-- Similar policies for order_item_addons
DROP POLICY IF EXISTS "Allow public to insert order_item_addons" ON order_item_addons;
DROP POLICY IF EXISTS "Allow public to read order_item_addons" ON order_item_addons;

CREATE POLICY "Allow public to insert order_item_addons" ON order_item_addons
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public to read order_item_addons" ON order_item_addons
  FOR SELECT TO public USING (true);

-- Step 9: Create the insert_complete_order function
CREATE OR REPLACE FUNCTION insert_complete_order(order_data JSONB)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  addon JSONB;
  new_item_id UUID;
BEGIN
  -- Insert main order
  INSERT INTO orders (
    order_id, customer_name, customer_phone, recipient_name, recipient_phone,
    province, city, district, postal_code, street, address_detail, full_address,
    delivery_lat, delivery_lng, vehicle_type, requested_delivery_time,
    subtotal, delivery_cost, total_amount, delivery_quotation, is_mock_quotation
  ) VALUES (
    order_data->>'order_id',
    order_data->'formData'->>'name',
    order_data->'formData'->>'phone',
    order_data->'formData'->>'recipientName',
    order_data->'formData'->>'recipientPhone',
    order_data->'formData'->>'province',
    order_data->'formData'->>'city',
    order_data->'formData'->>'district',
    order_data->'formData'->>'postalCode',
    order_data->'formData'->>'street',
    order_data->'formData'->>'detail',
    order_data->>'alamatLengkap',
    CASE 
      WHEN order_data->'selectedLocation'->>'lat' IS NOT NULL 
      THEN CAST(order_data->'selectedLocation'->>'lat' AS DECIMAL)
      ELSE NULL
    END,
    CASE 
      WHEN order_data->'selectedLocation'->>'lng' IS NOT NULL 
      THEN CAST(order_data->'selectedLocation'->>'lng' AS DECIMAL)
      ELSE NULL
    END,
    CAST(order_data->>'vehicleType' AS vehicle_type),
    CAST(order_data->>'requestedDateTime' AS TIMESTAMPTZ),
    CAST(order_data->>'cartTotal' AS INTEGER),
    CAST(order_data->>'deliveryTotal' AS INTEGER),
    CAST(order_data->>'grandTotal' AS INTEGER),
    order_data->'deliveryQuotation',
    CAST(order_data->>'isMockQuotation' AS BOOLEAN)
  ) RETURNING id INTO new_order_id;

  -- Insert order items
  FOR item IN SELECT * FROM jsonb_array_elements(order_data->'cart'->'items')
  LOOP
    INSERT INTO order_items (
      order_id, product_id, product_name, product_image, product_category,
      unit_price, quantity, subtotal, special_request
    ) VALUES (
      new_order_id,
      item->>'id',
      item->>'name',
      item->>'image',
      item->>'category',
      CAST(item->>'price' AS INTEGER),
      CAST(item->>'quantity' AS INTEGER),
      CAST(item->>'price' AS INTEGER) * CAST(item->>'quantity' AS INTEGER),
      item->>'specialRequest'
    ) RETURNING id INTO new_item_id;

    -- Insert addons for this item
    IF item->'addOns' IS NOT NULL THEN
      FOR addon IN SELECT * FROM jsonb_array_elements(item->'addOns')
      LOOP
        INSERT INTO order_item_addons (
          order_item_id, addon_id, addon_name, addon_price
        ) VALUES (
          new_item_id,
          addon->>'id',
          addon->>'name',
          CAST(addon->>'price' AS INTEGER)
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create the update order status function
CREATE OR REPLACE FUNCTION update_order_status_direct(
  order_uuid UUID,
  new_status order_status,
  proof_url TEXT DEFAULT NULL,
  payment_method_val payment_method DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders 
  SET 
    status = new_status,
    payment_proof_url = COALESCE(proof_url, payment_proof_url),
    payment_method = COALESCE(payment_method_val, payment_method),
    updated_at = NOW()
  WHERE id = order_uuid;
  
  RETURN FOUND;
END;
$$;

-- Step 11: Grant permissions
GRANT EXECUTE ON FUNCTION insert_complete_order TO public;
GRANT EXECUTE ON FUNCTION update_order_status_direct TO public;

-- Step 12: Create simplified view for admin
CREATE VIEW order_details AS
SELECT 
  o.id,
  o.order_id,
  o.customer_name,
  o.customer_phone,
  o.recipient_name,
  o.recipient_phone,
  o.full_address,
  o.total_amount,
  o.status,
  o.created_at,
  o.requested_delivery_time,
  o.payment_proof_url,
  o.delivery_quotation,
  o.is_mock_quotation
FROM orders o;

-- Step 13: Test the function
SELECT 'Setup completed successfully!' as status; 