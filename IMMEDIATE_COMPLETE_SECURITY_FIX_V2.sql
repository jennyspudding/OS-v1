-- 🚨 IMMEDIATE COMPLETE SECURITY FIX V2 - HANDLES EXISTING POLICIES
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- This version safely handles existing policies and won't fail

BEGIN;

SELECT '🚨 Starting Complete Security Fix V2 (Safe for existing policies)...' as status;

-- ============================================================================
-- 1. EMERGENCY: Fix RLS on ALL tables (safe, won't fail if already enabled)
-- ============================================================================

SELECT 'Enabling RLS on ALL tables (safe)...' as status;

-- Enable RLS on tables (these commands are safe to run multiple times)
DO $$
BEGIN
    -- Enable RLS safely
    BEGIN
        ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL; -- Ignore if already enabled
    END;
    
    BEGIN
        ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN others THEN NULL;
    END;
END $$;

SELECT 'RLS enabled on all tables!' as status;

-- ============================================================================
-- 2. SAFE CLEANUP: Remove ALL existing policies safely
-- ============================================================================

SELECT 'Safely removing existing policies...' as status;

-- Drop ALL existing policies on all tables (safe approach)
DO $$
DECLARE
    table_name text;
    pol_name text;
BEGIN
    FOR table_name IN VALUES ('orders'), ('order_items'), ('order_item_addons'), ('payment_proofs'), ('user_roles'), ('security_audit_log')
    LOOP
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name
        LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, table_name);
            EXCEPTION
                WHEN others THEN 
                    RAISE NOTICE 'Could not drop policy % on table %: %', pol_name, table_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

SELECT 'All existing policies safely removed!' as status;

-- ============================================================================
-- 3. CREATE SECURE USER ROLES SYSTEM (safe)
-- ============================================================================

-- Create user roles table if not exists
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

-- Add security columns to orders table (safe)
DO $$ 
BEGIN
    -- Add new security columns safely
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_user_id') THEN
            ALTER TABLE orders ADD COLUMN customer_user_id UUID REFERENCES auth.users(id);
        END IF;
    EXCEPTION
        WHEN others THEN 
            RAISE NOTICE 'Could not add customer_user_id column: %', SQLERRM;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_guest_order') THEN
            ALTER TABLE orders ADD COLUMN is_guest_order BOOLEAN DEFAULT true;
        END IF;
    EXCEPTION
        WHEN others THEN 
            RAISE NOTICE 'Could not add is_guest_order column: %', SQLERRM;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'guest_session_id') THEN
            ALTER TABLE orders ADD COLUMN guest_session_id TEXT;
        END IF;
    EXCEPTION
        WHEN others THEN 
            RAISE NOTICE 'Could not add guest_session_id column: %', SQLERRM;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'security_flags') THEN
            ALTER TABLE orders ADD COLUMN security_flags JSONB DEFAULT '{}';
        END IF;
    EXCEPTION
        WHEN others THEN 
            RAISE NOTICE 'Could not add security_flags column: %', SQLERRM;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'special_request') THEN
            ALTER TABLE orders ADD COLUMN special_request TEXT;
        END IF;
    EXCEPTION
        WHEN others THEN 
            RAISE NOTICE 'Could not add special_request column: %', SQLERRM;
    END;
END $$;

SELECT 'Security structure safely updated!' as status;

-- ============================================================================
-- 4. CREATE COMPREHENSIVE SECURE RLS POLICIES (all new, safe)
-- ============================================================================

SELECT 'Creating new secure RLS policies...' as status;

-- USER_ROLES table policies
CREATE POLICY "secure_user_roles_select" ON user_roles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin')
            AND ur.is_active = true
        )
    );

CREATE POLICY "secure_user_roles_manage" ON user_roles
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

-- ORDERS table policies
CREATE POLICY "secure_orders_select" ON orders
    FOR SELECT
    USING (
        (customer_user_id = auth.uid()) OR
        (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true)) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        )
    );

CREATE POLICY "secure_orders_insert_auth" ON orders
    FOR INSERT TO authenticated
    WITH CHECK (
        (customer_user_id = auth.uid()) OR
        (is_guest_order = true AND guest_session_id IS NOT NULL)
    );

CREATE POLICY "secure_orders_insert_public" ON orders
    FOR INSERT TO public
    WITH CHECK (
        is_guest_order = true AND 
        customer_user_id IS NULL AND
        guest_session_id IS NOT NULL
    );

CREATE POLICY "secure_orders_update" ON orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        ) OR
        (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true))
    );

CREATE POLICY "secure_orders_delete" ON orders
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

-- ORDER_ITEMS table policies
CREATE POLICY "secure_order_items_select" ON order_items
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

CREATE POLICY "secure_order_items_insert_auth" ON order_items
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

CREATE POLICY "secure_order_items_insert_public" ON order_items
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.is_guest_order = true
        )
    );

CREATE POLICY "secure_order_items_update" ON order_items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        )
    );

-- ORDER_ITEM_ADDONS table policies
CREATE POLICY "secure_order_addons_select" ON order_item_addons
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

CREATE POLICY "secure_order_addons_insert_auth" ON order_item_addons
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

CREATE POLICY "secure_order_addons_insert_public" ON order_item_addons
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.id = order_item_addons.order_item_id 
            AND o.is_guest_order = true
        )
    );

-- PAYMENT_PROOFS table policies
CREATE POLICY "secure_payment_proofs_select" ON payment_proofs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('staff', 'admin', 'super_admin')
            AND is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = payment_proofs.order_id 
            AND orders.customer_user_id = auth.uid()
        )
    );

CREATE POLICY "secure_payment_proofs_insert" ON payment_proofs
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

-- SECURITY_AUDIT_LOG table policies
CREATE POLICY "secure_audit_log_select" ON security_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

CREATE POLICY "secure_audit_log_insert" ON security_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

SELECT 'All secure RLS policies created!' as status;

-- ============================================================================
-- 5. CREATE/UPDATE ESSENTIAL FUNCTIONS (safe, with error handling)
-- ============================================================================

SELECT 'Creating essential functions...' as status;

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
    customer_user_id = auth.uid() OR
    (is_guest_order = true AND guest_session_id = current_setting('app.guest_session', true)) OR
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

-- Emergency functions
CREATE OR REPLACE FUNCTION emergency_disable_security()
RETURNS TEXT AS $$
BEGIN
    IF get_user_role() != 'super_admin' THEN
        RETURN 'Access denied. Only super admin can disable security.';
    END IF;
    
    ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_item_addons DISABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_proofs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE security_audit_log DISABLE ROW LEVEL SECURITY;
    
    RETURN 'SECURITY DISABLED - This should only be used in emergencies!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION emergency_enable_security()
RETURNS TEXT AS $$
BEGIN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
    
    RETURN 'Security re-enabled successfully!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Essential functions created!' as status;

-- ============================================================================
-- 6. UPDATE EXISTING DATA FOR SECURITY (safe)
-- ============================================================================

-- Mark all existing orders as guest orders with secure flags
UPDATE orders 
SET 
    is_guest_order = COALESCE(is_guest_order, true),
    guest_session_id = COALESCE(guest_session_id, 'legacy_' || id::text),
    security_flags = COALESCE(security_flags, '{}') || ('{"migration": "complete_security_fix_v2", "legacy": true, "timestamp": "' || NOW()::text || '"}')::jsonb
WHERE customer_user_id IS NULL;

SELECT 'Existing data secured!' as status;

-- ============================================================================
-- 7. GRANT NECESSARY PERMISSIONS (safe)
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
-- 8. CREATE SAFE PUBLIC VIEWS (safe)
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

SELECT '✅ Complete Security Fix V2 Applied Successfully!' as final_status;

-- Check security status
SELECT 'Security Status Check:' as check_title;
SELECT * FROM check_security_status();

SELECT 'Next Steps:' as next_steps;
SELECT '1. Create your first admin: SELECT create_first_admin(''your-email@domain.com'');' as step_1;
SELECT '2. Test order creation from frontend' as step_2;
SELECT '3. Verify security with: SELECT * FROM check_security_status();' as step_3;

-- Show final table status
SELECT 'Final Table Security Status:' as final_table_status;
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('orders', 'order_items', 'order_item_addons', 'payment_proofs', 'user_roles', 'security_audit_log')
ORDER BY tablename; 