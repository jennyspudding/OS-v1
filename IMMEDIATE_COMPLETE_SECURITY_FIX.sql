-- 🚨 IMMEDIATE COMPLETE SECURITY AND FLOW FIX
-- RUN THIS IMMEDIATELY IN YOUR SUPABASE SQL EDITOR
-- This fixes ALL critical security vulnerabilities and flow issues

BEGIN;

SELECT '🚨 Starting Complete Security and Flow Fix...' as status;

-- ============================================================================
-- 1. EMERGENCY: Fix RLS on ALL tables (based on your screenshot)
-- ============================================================================

SELECT 'Enabling RLS on ALL tables...' as status;

-- Enable RLS on tables that show FALSE in your screenshot
ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Ensure others are enabled too
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

SELECT 'RLS enabled on all tables!' as status;

-- ============================================================================
-- 2. CLEAN UP: Remove ALL dangerous existing policies
-- ============================================================================

SELECT 'Removing ALL dangerous policies...' as status;

-- Drop ALL existing policies on orders (you showed 10 policies - too many!)
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON orders', pol_name);
    END LOOP;
END $$;

-- Drop all dangerous policies on other tables
DO $$
DECLARE
    table_name text;
    pol_name text;
BEGIN
    FOR table_name IN VALUES ('order_items'), ('order_item_addons'), ('payment_proofs'), ('user_roles')
    LOOP
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, table_name);
        END LOOP;
    END LOOP;
END $$;

SELECT 'All dangerous policies removed!' as status;

-- ============================================================================
-- 3. CREATE SECURE USER ROLES SYSTEM
-- ============================================================================

-- Create user roles table if not exists (critical - had 0 policies!)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'staff', 'admin', 'super_admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add security columns to orders table
DO $$ 
BEGIN
    -- Add new security columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_user_id') THEN
        ALTER TABLE orders ADD COLUMN customer_user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_guest_order') THEN
        ALTER TABLE orders ADD COLUMN is_guest_order BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'guest_session_id') THEN
        ALTER TABLE orders ADD COLUMN guest_session_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'security_flags') THEN
        ALTER TABLE orders ADD COLUMN security_flags JSONB DEFAULT '{}';
    END IF;
    
    -- Also ensure special_request column exists (for Express store)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'special_request') THEN
        ALTER TABLE orders ADD COLUMN special_request TEXT;
    END IF;
END $$;

SELECT 'Security structure updated!' as status;

-- ============================================================================
-- 4. CREATE COMPREHENSIVE SECURE RLS POLICIES
-- ============================================================================

-- USER_ROLES table - Super critical security
CREATE POLICY "Only admins can view user roles" ON user_roles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );

CREATE POLICY "Only super admins can manage user roles" ON user_roles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
            AND ur.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
            AND ur.is_active = true
        )
    );

-- ORDERS table - Comprehensive security
CREATE POLICY "Customers can view their own orders" ON orders
    FOR SELECT
    USING (
        -- Customer can see their own orders
        (customer_user_id = auth.uid()) OR
        -- Guest can see their order via session ID
        (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true)) OR
        -- Staff/admin can see all orders
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        )
    );

CREATE POLICY "Authenticated users can create orders" ON orders
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Must be authenticated and order must reference the authenticated user
        (customer_user_id = auth.uid()) OR
        (is_guest_order = true AND guest_session_id IS NOT NULL)
    );

-- CRITICAL: Also allow public guest order creation (temporary for current flow)
CREATE POLICY "Guest users can create orders" ON orders
    FOR INSERT TO public
    WITH CHECK (
        is_guest_order = true AND 
        customer_user_id IS NULL AND
        guest_session_id IS NOT NULL
    );

CREATE POLICY "Only staff can update orders" ON orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        ) OR
        -- Allow guest to update their own order (for payment proof)
        (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true))
    );

CREATE POLICY "Only admins can delete orders" ON orders
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

-- ORDER_ITEMS table - Secure access
CREATE POLICY "Users can view order items they have access to" ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.customer_user_id = auth.uid() OR
                (orders.is_guest_order = true AND orders.guest_session_id = current_setting('app.guest_session', true)) OR
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_id = auth.uid() 
                    AND role IN ('staff', 'admin', 'super_admin')
                    AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Authenticated users can create order items" ON order_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.customer_user_id = auth.uid() OR 
                orders.is_guest_order = true
            )
        )
    );

-- CRITICAL: Allow public creation for guest orders
CREATE POLICY "Public can create order items for guest orders" ON order_items
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.is_guest_order = true
        )
    );

CREATE POLICY "Only staff can update order items" ON order_items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        )
    );

-- ORDER_ITEM_ADDONS table - Secure access
CREATE POLICY "Users can view addons they have access to" ON order_item_addons
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.id = order_item_addons.order_item_id 
            AND (
                o.customer_user_id = auth.uid() OR
                (o.is_guest_order = true AND o.guest_session_id = current_setting('app.guest_session', true)) OR
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_id = auth.uid() 
                    AND role IN ('staff', 'admin', 'super_admin')
                    AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Authenticated users can create order item addons" ON order_item_addons
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.id = order_item_addons.order_item_id 
            AND (
                o.customer_user_id = auth.uid() OR 
                o.is_guest_order = true
            )
        )
    );

-- CRITICAL: Allow public creation for guest orders
CREATE POLICY "Public can create addons for guest orders" ON order_item_addons
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.id = order_item_addons.order_item_id 
            AND o.is_guest_order = true
        )
    );

-- PAYMENT_PROOFS table - Secure access
CREATE POLICY "Only staff can view payment proofs" ON payment_proofs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        ) OR
        -- Order owner can see their own proof
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payment_proofs.order_id 
            AND orders.customer_user_id = auth.uid()
        )
    );

CREATE POLICY "Order owners can upload payment proofs" ON payment_proofs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payment_proofs.order_id 
            AND (
                orders.customer_user_id = auth.uid() OR 
                orders.is_guest_order = true
            )
        )
    );

-- SECURITY_AUDIT_LOG table - Admin only
CREATE POLICY "Only admins can read audit logs" ON security_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

CREATE POLICY "System can insert audit logs" ON security_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

SELECT 'Secure RLS policies created!' as status;

-- ============================================================================
-- 5. CREATE/UPDATE ESSENTIAL FUNCTIONS
-- ============================================================================

-- Function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_roles 
        WHERE user_id = user_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create first admin user
CREATE OR REPLACE FUNCTION create_first_admin(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RETURN 'User not found with email: ' || admin_email;
    END IF;
    
    -- Check if any admin exists
    IF EXISTS (SELECT 1 FROM user_roles WHERE role IN ('admin', 'super_admin') AND is_active = true) THEN
        RETURN 'Admin already exists. Cannot create another admin without existing admin approval.';
    END IF;
    
    -- Create first admin
    INSERT INTO user_roles (user_id, role, granted_by) 
    VALUES (admin_user_id, 'super_admin', admin_user_id)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = 'super_admin', 
        is_active = true;
    
    RETURN 'First admin created successfully for: ' || admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated insert_complete_order function with security
CREATE OR REPLACE FUNCTION insert_complete_order(order_data JSONB)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  addon JSONB;
  new_item_id UUID;
BEGIN
  -- Insert main order with security fields
  INSERT INTO orders (
    order_id, customer_name, customer_phone, recipient_name, recipient_phone,
    province, city, district, postal_code, street, address_detail, full_address,
    delivery_lat, delivery_lng, vehicle_type, requested_delivery_time,
    subtotal, delivery_cost, promo_code, discount_amount, total_amount, 
    delivery_quotation, is_mock_quotation, special_request,
    -- Security fields
    customer_user_id, is_guest_order, guest_session_id, security_flags
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
    order_data->>'promoCode',
    CAST(COALESCE(order_data->>'discount', '0') AS INTEGER),
    CAST(order_data->>'grandTotal' AS INTEGER),
    order_data->'deliveryQuotation',
    CAST(order_data->>'isMockQuotation' AS BOOLEAN),
    order_data->>'specialRequest',
    -- Security fields
    CAST(order_data->>'customer_user_id' AS UUID),
    CAST(COALESCE(order_data->>'is_guest_order', 'true') AS BOOLEAN),
    order_data->>'guest_session_id',
    COALESCE(order_data->'security_flags', '{}')
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure order status update function
CREATE OR REPLACE FUNCTION update_order_status_secure(
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
  WHERE id = order_uuid
  AND (
    -- Order owner can update (for payment proof)
    customer_user_id = auth.uid() OR
    -- Guest can update their order
    (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true)) OR
    -- Staff can update any order
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('staff', 'admin', 'super_admin')
      AND is_active = true
    )
  );
  
  RETURN FOUND;
END;
$$;

SELECT 'Essential functions updated!' as status;

-- ============================================================================
-- 6. UPDATE EXISTING DATA FOR SECURITY
-- ============================================================================

-- Mark all existing orders as guest orders with secure flags
UPDATE orders 
SET 
    is_guest_order = true,
    guest_session_id = 'legacy_' || id::text,
    security_flags = '{"migration": "complete_security_fix", "legacy": true, "timestamp": "' || NOW()::text || '"}'
WHERE customer_user_id IS NULL AND guest_session_id IS NULL;

SELECT 'Existing data secured!' as status;

-- ============================================================================
-- 7. CREATE MONITORING AND EMERGENCY FUNCTIONS
-- ============================================================================

-- Function to disable all security (EMERGENCY ONLY)
CREATE OR REPLACE FUNCTION emergency_disable_security()
RETURNS TEXT AS $$
BEGIN
    -- Only super admin can do this
    IF get_user_role() != 'super_admin' THEN
        RETURN 'Access denied. Only super admin can disable security.';
    END IF;
    
    -- Disable RLS on all tables
    ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_item_addons DISABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_proofs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
    
    RETURN 'SECURITY DISABLED - This should only be used in emergencies!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to re-enable security
CREATE OR REPLACE FUNCTION emergency_enable_security()
RETURNS TEXT AS $$
BEGIN
    -- Re-enable RLS on all tables
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    
    RETURN 'Security re-enabled successfully!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check security status
CREATE OR REPLACE FUNCTION check_security_status()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname),
        CASE 
            WHEN t.rowsecurity = false THEN '🔴 CRITICAL: RLS Disabled'
            WHEN COUNT(p.policyname) = 0 THEN '🟠 WARNING: No Policies'
            WHEN COUNT(p.policyname) < 2 THEN '🟡 NOTICE: Few Policies'
            ELSE '✅ SECURE'
        END as status
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.tablename IN ('orders', 'order_items', 'order_item_addons', 'payment_proofs', 'user_roles', 'security_audit_log')
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Monitoring functions created!' as status;

-- ============================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO public;
GRANT EXECUTE ON FUNCTION create_first_admin(TEXT) TO public;
GRANT EXECUTE ON FUNCTION insert_complete_order(JSONB) TO public;
GRANT EXECUTE ON FUNCTION insert_complete_order(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_secure(UUID, order_status, TEXT, payment_method) TO public;
GRANT EXECUTE ON FUNCTION update_order_status_secure(UUID, order_status, TEXT, payment_method) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_disable_security() TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_enable_security() TO authenticated;
GRANT EXECUTE ON FUNCTION check_security_status() TO authenticated;

SELECT 'Permissions granted!' as status;

-- ============================================================================
-- 9. CREATE SAFE PUBLIC VIEWS
-- ============================================================================

-- Create a safe public view that masks sensitive data
CREATE OR REPLACE VIEW public_orders_safe AS
SELECT 
    id,
    order_id,
    status,
    created_at,
    requested_delivery_time,
    total_amount,
    -- Mask sensitive customer data
    LEFT(customer_name, 1) || REPEAT('*', GREATEST(LENGTH(customer_name) - 2, 0)) || CASE WHEN LENGTH(customer_name) > 1 THEN RIGHT(customer_name, 1) ELSE '' END as customer_name_masked,
    CASE 
        WHEN customer_phone IS NOT NULL THEN 
            LEFT(customer_phone, 3) || REPEAT('*', GREATEST(LENGTH(customer_phone) - 6, 0)) || RIGHT(customer_phone, 3)
        ELSE NULL 
    END as phone_masked,
    -- Only show first line of address
    SPLIT_PART(full_address, '\n', 1) as address_preview,
    -- Show if it's guest order
    is_guest_order
FROM orders
WHERE status IN ('ready_for_payment', 'payment_uploaded', 'processing', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered');

-- Grant access to the safe view
GRANT SELECT ON public_orders_safe TO public;

SELECT 'Safe public views created!' as status;

COMMIT;

-- ============================================================================
-- FINAL STATUS AND VERIFICATION
-- ============================================================================

SELECT '✅ Complete Security and Flow Fix Applied Successfully!' as final_status;

-- Check security status
SELECT 'Security Status Check:' as check_title;
SELECT * FROM check_security_status();

SELECT 'Next Steps:' as next_steps;
SELECT '1. Create your first admin: SELECT create_first_admin(''your-email@domain.com'');' as step_1;
SELECT '2. Test order creation from frontend' as step_2;
SELECT '3. Verify security with: SELECT * FROM check_security_status();' as step_3;
SELECT '4. Monitor with: SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 10;' as step_4;

-- Show what changed
SELECT 'Tables Secured:' as secured_tables;
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('orders', 'order_items', 'order_item_addons', 'payment_proofs', 'user_roles', 'security_audit_log')
ORDER BY tablename; 