# Storewide Discount Migration Instructions

## Overview
This migration adds support for the 10% storewide discount (minimum purchase 175,000 IDR) to the database and admin interface.

## Database Migration
Run the following SQL script in your Supabase SQL editor:

```sql
-- Add storewide discount support to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS storewide_discount_amount INTEGER DEFAULT 0, -- storewide discount in rupiah
ADD COLUMN IF NOT EXISTS is_storewide_discount_eligible BOOLEAN DEFAULT FALSE; -- flag for discount eligibility

-- Check if the function already exists and drop it if needed
DROP FUNCTION IF EXISTS insert_complete_order(JSONB);

-- Update the insert_complete_order function to handle storewide discount data
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
    subtotal, delivery_cost, promo_code, discount_amount, 
    storewide_discount_amount, is_storewide_discount_eligible,
    total_amount, delivery_quotation, is_mock_quotation,
    is_express_order
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
    CAST(COALESCE(order_data->>'storediscountAmount', '0') AS INTEGER),
    CAST(COALESCE(order_data->>'isDiscountEligible', 'false') AS BOOLEAN),
    CAST(order_data->>'grandTotal' AS INTEGER),
    order_data->'deliveryQuotation',
    CAST(order_data->>'isMockQuotation' AS BOOLEAN),
    CAST(COALESCE(order_data->>'isExpress', 'false') AS BOOLEAN)
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

-- Update the order_details view to include storewide discount information
DROP VIEW IF EXISTS order_details;
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
```

## Testing the Migration

After running the migration, test with a sample express order:

1. Go to the express store
2. Add items totaling 175,000 IDR or more 
3. Complete the checkout process
4. Check that the 10% discount is applied and visible in:
   - Express thank you page
   - Admin order management pages

## Verification

Check that the following fields are now populated in the database:
- `orders.storewide_discount_amount` - contains the discount amount in IDR
- `orders.is_storewide_discount_eligible` - boolean flag for eligibility

## Files Modified

### Express Store
- `jennys-pudding/app/express-thank-you/page.tsx` - Added storewide discount display

### Admin App
- `admin-app/src/app/dashboard/orders/page.tsx` - Added storewide discount display
- `admin-app/src/app/dashboard/express-orders/page.tsx` - Added storewide discount display
- `admin-app/src/app/dashboard/orders/pending/page.tsx` - Added storewide discount display
- `admin-app/src/app/dashboard/delivery/page.tsx` - Added storewide discount display
- `admin-app/src/app/dashboard/express-delivery/page.tsx` - Added storewide discount display

### Database
- `jennys-pudding/add-storewide-discount-support.sql` - Migration script

## Notes

The storewide discount logic is:
- Minimum purchase: 175,000 IDR
- Discount: 10% of subtotal
- Applies to both regular and express orders
- Stacks with promo code discounts 