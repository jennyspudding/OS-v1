-- Add promo columns to orders table
ALTER TABLE orders 
ADD COLUMN promo_code VARCHAR(50),
ADD COLUMN discount_amount INTEGER DEFAULT 0; -- in rupiah cents

-- Update the insert_complete_order function to handle promo data
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
    subtotal, delivery_cost, promo_code, discount_amount, total_amount, 
    delivery_quotation, is_mock_quotation
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
    order_data->>'promoCode',
    CAST(COALESCE(order_data->>'discount', '0') AS INTEGER),
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