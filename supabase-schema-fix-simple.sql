-- Simple Schema Fix for Jenny's Pudding - Update field lengths
-- This version avoids complex JSON syntax issues

-- Step 1: Drop the view that depends on the columns we need to modify
DROP VIEW IF EXISTS order_details;

-- Step 2: Fix the critical field lengths that are causing the error
ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(100);
ALTER TABLE order_item_addons ALTER COLUMN addon_id TYPE VARCHAR(100);
ALTER TABLE order_items ALTER COLUMN product_name TYPE VARCHAR(500);
ALTER TABLE order_item_addons ALTER COLUMN addon_name TYPE VARCHAR(500);

-- Step 3: Fix other potentially long fields
ALTER TABLE orders ALTER COLUMN customer_name TYPE VARCHAR(500);
ALTER TABLE orders ALTER COLUMN recipient_name TYPE VARCHAR(500);
ALTER TABLE orders ALTER COLUMN province TYPE VARCHAR(200);
ALTER TABLE orders ALTER COLUMN city TYPE VARCHAR(200);
ALTER TABLE orders ALTER COLUMN district TYPE VARCHAR(200);
ALTER TABLE order_items ALTER COLUMN product_category TYPE VARCHAR(200);

-- Step 4: Create a simplified view for now (you can enhance it later)
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
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_id, o.customer_name, o.customer_phone, o.recipient_name, 
         o.recipient_phone, o.full_address, o.total_amount, o.status, o.created_at,
         o.requested_delivery_time, o.payment_proof_url;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id_new ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_addons_addon_id ON order_item_addons(addon_id);

-- Step 6: Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'order_item_addons') 
  AND character_maximum_length IS NOT NULL
  AND column_name IN ('product_id', 'addon_id', 'product_name', 'addon_name', 'customer_name', 'recipient_name')
ORDER BY table_name, column_name; 