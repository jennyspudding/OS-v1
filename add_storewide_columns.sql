-- Add Storewide Discount Columns to Orders Table
-- Run this in your Supabase SQL Editor

-- 1. Add the missing storewide discount columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS storewide_discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_storewide_discount_eligible BOOLEAN DEFAULT FALSE;

-- 2. Check if the recent order has storewide discount data
SELECT 
  order_id,
  customer_name,
  total_amount,
  subtotal,
  delivery_cost,
  storewide_discount_amount,
  is_storewide_discount_eligible,
  created_at
FROM orders 
WHERE order_id LIKE 'JPE-%' 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verify the column structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('storewide_discount_amount', 'is_storewide_discount_eligible')
ORDER BY column_name; 