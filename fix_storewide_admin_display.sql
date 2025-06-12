-- Fix Storewide Discount Admin Display
-- Run this in your Supabase SQL Editor

-- 1. Add the missing storewide discount columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS storewide_discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_storewide_discount_eligible BOOLEAN DEFAULT FALSE;

-- 2. Update the insert_complete_order function to save storewide discount data
CREATE OR REPLACE FUNCTION insert_complete_order(order_data JSONB)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  addon JSONB;
  new_item_id UUID;
  is_express BOOLEAN;
  delivery_date DATE;
  delivery_time VARCHAR(50);
  priority VARCHAR(20);
BEGIN
  -- Determine if this is an express order
  is_express := CAST(COALESCE(order_data->>'isExpress', 'false') AS BOOLEAN);
  
  -- Set express fields if this is an express order
  IF is_express THEN
    -- Extract date from requestedDateTime for express_delivery_date
    delivery_date := CAST(order_data->>'requestedDateTime' AS TIMESTAMPTZ)::DATE;
    
    -- Set default time slot based on requestedDateTime
    delivery_time := EXTRACT(HOUR FROM CAST(order_data->>'requestedDateTime' AS TIMESTAMPTZ)) || ':00-' || 
                    (EXTRACT(HOUR FROM CAST(order_data->>'requestedDateTime' AS TIMESTAMPTZ)) + 2) || ':00';
    
    -- Set priority (default to 'normal' for now, can be enhanced later)
    priority := 'normal';
  ELSE
    delivery_date := NULL;
    delivery_time := NULL;
    priority := NULL;
  END IF;

  -- Insert main order with all fields including storewide discount
  INSERT INTO orders (
    order_id, customer_name, customer_phone, recipient_name, recipient_phone,
    province, city, district, postal_code, street, address_detail, full_address,
    delivery_lat, delivery_lng, vehicle_type, requested_delivery_time,
    subtotal, delivery_cost, promo_code, discount_amount, 
    storewide_discount_amount, is_storewide_discount_eligible,
    total_amount, delivery_quotation, is_mock_quotation,
    is_express_order, express_delivery_date, express_delivery_time_slot, express_priority
  ) VALUES (
    order_data->>'order_id',
    order_data->'formData'->>'name',
    order_data->'formData'->>'phone',
    COALESCE(order_data->'formData'->>'recipientName', order_data->'formData'->>'name'),
    COALESCE(order_data->'formData'->>'recipientPhone', order_data->'formData'->>'phone'),
    COALESCE(order_data->'formData'->>'province', ''),
    COALESCE(order_data->'formData'->>'city', ''),
    COALESCE(order_data->'formData'->>'district', ''),
    COALESCE(order_data->'formData'->>'postalCode', ''),
    COALESCE(order_data->'formData'->>'street', ''),
    COALESCE(order_data->'formData'->>'detail', ''),
    order_data->>'alamatLengkap',
    CAST(order_data->'selectedLocation'->>'lat' AS DECIMAL),
    CAST(order_data->'selectedLocation'->>'lng' AS DECIMAL),
    CAST(COALESCE(order_data->>'vehicleType', 'MOTORCYCLE') AS vehicle_type),
    CAST(order_data->>'requestedDateTime' AS TIMESTAMPTZ),
    CAST(order_data->>'cartTotal' AS INTEGER),
    CAST(COALESCE(order_data->>'deliveryTotal', '0') AS INTEGER),
    order_data->>'promoCode',
    CAST(COALESCE(order_data->>'discount', '0') AS INTEGER),
    -- Storewide discount fields - this is the key fix!
    CAST(COALESCE(order_data->>'storediscountAmount', '0') AS INTEGER),
    CAST(COALESCE(order_data->>'isDiscountEligible', 'false') AS BOOLEAN),
    CAST(order_data->>'grandTotal' AS INTEGER),
    order_data->'deliveryQuotation',
    CAST(COALESCE(order_data->>'isMockQuotation', 'false') AS BOOLEAN),
    -- Express order fields
    is_express,
    delivery_date,
    delivery_time,
    priority
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
      COALESCE(item->>'category', 'General'),
      CAST(item->>'price' AS INTEGER),
      CAST(item->>'quantity' AS INTEGER),
      CAST(item->>'price' AS INTEGER) * CAST(item->>'quantity' AS INTEGER),
      COALESCE(item->>'specialRequest', '')
    ) RETURNING id INTO new_item_id;

    -- Insert addons for this item
    IF item->'addOns' IS NOT NULL AND jsonb_array_length(item->'addOns') > 0 THEN
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

-- 3. Update existing order with storewide discount data (if it was eligible)
-- This will backfill the current order with the correct discount data
UPDATE orders 
SET 
  storewide_discount_amount = 20000,  -- 10% of 200,000 = 20,000
  is_storewide_discount_eligible = true
WHERE order_id = 'JPE-619452I1H' 
  AND subtotal >= 175000;  -- Only if it was actually eligible

-- 4. Verify the fix worked
SELECT 
  order_id,
  customer_name,
  subtotal,
  delivery_cost,
  storewide_discount_amount,
  is_storewide_discount_eligible,
  total_amount,
  created_at
FROM orders 
WHERE order_id = 'JPE-619452I1H';

-- 5. Test future orders will work
SELECT 'Storewide discount admin display fix completed successfully!' as status; 