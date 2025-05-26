-- Schema Fix for Jenny's Pudding - Update field lengths
-- Run this after the main schema to fix VARCHAR length issues

-- Step 1: Drop the view that depends on the columns we need to modify
DROP VIEW IF EXISTS order_details;

-- Step 2: Fix product_id length in order_items table
ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(100);

-- Step 3: Fix addon_id length in order_item_addons table  
ALTER TABLE order_item_addons ALTER COLUMN addon_id TYPE VARCHAR(100);

-- Step 4: Ensure other potentially long fields have adequate lengths
ALTER TABLE orders ALTER COLUMN order_id TYPE VARCHAR(50); -- Should be fine but ensuring
ALTER TABLE orders ALTER COLUMN customer_name TYPE VARCHAR(500);
ALTER TABLE orders ALTER COLUMN recipient_name TYPE VARCHAR(500);
ALTER TABLE orders ALTER COLUMN province TYPE VARCHAR(200);
ALTER TABLE orders ALTER COLUMN city TYPE VARCHAR(200);
ALTER TABLE orders ALTER COLUMN district TYPE VARCHAR(200);

-- Step 5: Fix product name length in order_items
ALTER TABLE order_items ALTER COLUMN product_name TYPE VARCHAR(500);
ALTER TABLE order_items ALTER COLUMN product_category TYPE VARCHAR(200);

-- Step 6: Fix addon name length
ALTER TABLE order_item_addons ALTER COLUMN addon_name TYPE VARCHAR(500);

-- Step 7: Recreate the order_details view with the updated column types
CREATE VIEW order_details AS
SELECT 
  o.*,
  COALESCE(
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
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'addon_id', oia.addon_id,
                'addon_name', oia.addon_name,
                'addon_price', oia.addon_price
              )
            ), 
            '[]'::json
          )
          FROM order_item_addons oia 
          WHERE oia.order_item_id = oi.id
        )
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Step 8: Add any missing indexes after schema changes
CREATE INDEX IF NOT EXISTS idx_order_items_product_id_new ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_addons_addon_id ON order_item_addons(addon_id);

-- Step 9: Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'order_item_addons') 
  AND character_maximum_length IS NOT NULL
ORDER BY table_name, column_name; 