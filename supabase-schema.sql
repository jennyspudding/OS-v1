-- Jenny's Pudding Database Schema for Supabase
-- This schema handles the complete order management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
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

CREATE TYPE vehicle_type AS ENUM ('MOTORCYCLE', 'CAR');

CREATE TYPE payment_method AS ENUM ('bank_transfer', 'qris', 'cash_on_delivery');

-- Main Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(20) UNIQUE NOT NULL, -- JP-xxxxxx format
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  
  -- Address Information
  province VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  postal_code VARCHAR(10),
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
  subtotal INTEGER NOT NULL, -- in rupiah cents
  delivery_cost INTEGER DEFAULT 0, -- in rupiah cents
  total_amount INTEGER NOT NULL, -- in rupiah cents
  
  -- Order Status and Tracking
  status order_status DEFAULT 'ready_for_payment',
  payment_method payment_method,
  payment_proof_url TEXT, -- URL to uploaded payment proof
  
  -- Delivery Quotation Data (JSON)
  delivery_quotation JSONB, -- Store the complete delivery quotation response
  is_mock_quotation BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Admin fields
  processed_by UUID, -- Reference to admin user who processed the order
  delivery_notes TEXT,
  internal_notes TEXT
);

-- Order Items Table (for cart items)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Product Information
  product_id VARCHAR(50) NOT NULL, -- Original product ID from the system
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  product_category VARCHAR(100),
  
  -- Pricing and Quantity
  unit_price INTEGER NOT NULL, -- in rupiah cents
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL, -- unit_price * quantity
  
  -- Product Details
  old_price INTEGER, -- for discounted items
  discount_percentage INTEGER,
  special_request TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Item Add-ons Table
CREATE TABLE order_item_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  
  addon_id VARCHAR(50) NOT NULL,
  addon_name VARCHAR(255) NOT NULL,
  addon_price INTEGER NOT NULL, -- in rupiah cents per item
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Status History Table (for tracking status changes)
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  previous_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID, -- Reference to user who made the change
  change_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Proofs Table (for multiple payment proof uploads)
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID, -- Reference to admin who verified
  verification_notes TEXT
);

-- Delivery Tracking Table
CREATE TABLE delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  status VARCHAR(100) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_delivery_time ON orders(requested_delivery_time);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_order_item_addons_order_item_id ON order_item_addons(order_item_id);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

CREATE INDEX idx_payment_proofs_order_id ON payment_proofs(order_id);
CREATE INDEX idx_delivery_tracking_order_id ON delivery_tracking(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to orders table
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create status history
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, previous_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply status history trigger to orders table
CREATE TRIGGER create_order_status_history 
  AFTER UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION create_status_history();

-- Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your authentication needs)
-- Allow public to insert orders (for customer orders)
CREATE POLICY "Allow public to insert orders" ON orders
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow public to read their own orders (if you implement customer accounts)
CREATE POLICY "Allow users to read own orders" ON orders
  FOR SELECT TO public
  USING (true); -- Adjust this based on your auth system

-- Allow authenticated users to update orders (for admin)
CREATE POLICY "Allow authenticated to update orders" ON orders
  FOR UPDATE TO authenticated
  USING (true);

-- Similar policies for related tables
CREATE POLICY "Allow public to insert order_items" ON order_items
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read order_items" ON order_items
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public to insert order_item_addons" ON order_item_addons
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read order_item_addons" ON order_item_addons
  FOR SELECT TO public
  USING (true);

-- Payment proofs policies
CREATE POLICY "Allow public to insert payment_proofs" ON payment_proofs
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read payment_proofs" ON payment_proofs
  FOR SELECT TO public
  USING (true);

-- Status history and tracking (read-only for public)
CREATE POLICY "Allow public to read order_status_history" ON order_status_history
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public to read delivery_tracking" ON delivery_tracking
  FOR SELECT TO public
  USING (true);

-- Create a view for easy order retrieval with all related data
CREATE VIEW order_details AS
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'product_name', oi.product_name,
      'product_image', oi.product_image,
      'product_category', oi.product_category,
      'unit_price', oi.unit_price,
      'quantity', oi.quantity,
      'subtotal', oi.subtotal,
      'old_price', oi.old_price,
      'discount_percentage', oi.discount_percentage,
      'special_request', oi.special_request,
      'addons', (
        SELECT json_agg(
          json_build_object(
            'addon_id', oia.addon_id,
            'addon_name', oia.addon_name,
            'addon_price', oia.addon_price
          )
        )
        FROM order_item_addons oia 
        WHERE oia.order_item_id = oi.id
      )
    )
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Create a function to insert complete order data
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
    CAST(order_data->'selectedLocation'->>'lat' AS DECIMAL),
    CAST(order_data->'selectedLocation'->>'lng' AS DECIMAL),
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

-- Example usage comment:
-- SELECT insert_complete_order('{"order_id": "JP-123456", "formData": {...}, "cart": {...}, ...}'); 