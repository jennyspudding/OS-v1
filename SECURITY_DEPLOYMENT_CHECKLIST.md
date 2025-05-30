# 🛡️ Security Deployment Checklist - Jenny's Pudding

## 🚨 CRITICAL: IMMEDIATE ACTIONS REQUIRED

### ⚡ Step 1: Emergency Security Fix (Do This Now!)

1. **Backup your current database**
   ```bash
   # In Supabase Dashboard -> Settings -> Database -> Create Backup
   ```

2. **Run the Emergency Security Fix**
   - Open your Supabase SQL Editor
   - Copy and paste the entire `EMERGENCY_SECURITY_FIX.sql` script
   - Execute it immediately
   - ✅ Verify you see "Emergency Security Fix Completed Successfully!"

3. **Create your first admin user**
   ```sql
   -- Replace with your actual email
   SELECT create_first_admin('your-admin-email@domain.com');
   ```

### ⚡ Step 2: Verify Security Status

Run this query to check current security:
```sql
-- Check RLS status
SELECT 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('orders', 'order_items', 'order_item_addons', 'payment_proofs')
ORDER BY tablename;

-- Check if dangerous policies still exist
SELECT policyname, tablename, cmd, roles
FROM pg_policies 
WHERE policyname LIKE '%public%access%' OR policyname LIKE '%all%access%';
```

**Expected Results:**
- ✅ RLS should be enabled (`true`) for all tables
- ✅ No policies with "public access" or "all access" should exist
- ✅ Each table should have 2-4 secure policies

---

## 🔧 Frontend Code Updates Required

### Update 1: Secure Order Creation

**File:** `lib/supabase.ts`
```typescript
// Update insertCompleteOrder function
export const insertCompleteOrder = async (orderData: any) => {
  try {
    // Generate guest session ID for unauthenticated users
    const guestSessionId = localStorage.getItem('guest_session_id') || 
                          `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_session_id', guestSessionId);

    // Add security fields
    const secureOrderData = {
      ...orderData,
      is_guest_order: true,
      guest_session_id: guestSessionId,
      customer_user_id: null // Will be set when customer authentication is implemented
    };

    const { data, error } = await supabase.rpc('insert_complete_order', {
      order_data: secureOrderData
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Secure order creation failed:', error);
    throw error;
  }
}
```

### Update 2: Secure Order Status Updates

**File:** `lib/supabase.ts`
```typescript
export const updateOrderStatusByUuid = async (orderUuid: string, status: string, paymentProofUrl: string | null = null) => {
  try {
    // This now requires authentication for most operations
    // Only payment proof upload is allowed for guests
    
    if (status === 'payment_uploaded' && paymentProofUrl) {
      // Guest can upload payment proof
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          payment_proof_url: paymentProofUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderUuid)
        .eq('is_guest_order', true) // Security: only guest orders
        .select();

      if (error) throw error;
      return data;
    } else {
      // All other status updates require staff authentication
      throw new Error('Status update requires staff authentication');
    }
  } catch (error) {
    console.error('Secure order update failed:', error);
    throw error;
  }
}
```

---

## 🧪 Testing Checklist

### Test 1: Order Creation (Should Work)
```bash
# Test creating a new order from your frontend
# ✅ Should work with guest session
# ✅ Order should have is_guest_order = true
# ✅ Order should have guest_session_id set
```

### Test 2: Unauthorized Access (Should Fail)
```sql
-- Try to update order status without authentication
UPDATE orders SET status = 'delivered' WHERE order_id = 'JP-123456';
-- ❌ Should fail with "insufficient permissions"

-- Try to read all customer data
SELECT customer_name, customer_phone, full_address FROM orders;
-- ❌ Should be blocked by RLS
```

### Test 3: Admin Functions (Should Work for Admin)
```sql
-- After creating admin user, test admin functions
SELECT get_user_role(); -- Should return 'super_admin'

-- Admin should be able to update orders
UPDATE orders SET status = 'processing' WHERE order_id = 'JP-123456';
-- ✅ Should work for admin users
```

---

## 📊 Monitoring Setup

### Set Up Security Monitoring

1. **Create monitoring dashboard**
   ```sql
   -- Check for suspicious activity
   SELECT * FROM security_audit_log 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. **Set up alerts for:**
   - Multiple failed login attempts
   - Unusual order creation patterns
   - Unauthorized access attempts
   - RLS policy violations

### Daily Security Checks
```sql
-- Run this daily to check security health
SELECT 
    'RLS Status' as check_type,
    COUNT(*) as total_tables,
    COUNT(*) FILTER (WHERE rowsecurity = true) as secured_tables
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'order_item_addons', 'payment_proofs')

UNION ALL

SELECT 
    'Recent Suspicious Activity' as check_type,
    COUNT(*) as count,
    0
FROM security_audit_log 
WHERE created_at > NOW() - INTERVAL '24 hours'
AND (operation LIKE '%FAILED%' OR table_name = 'auth.users');
```

---

## 🚀 Production Deployment Steps

### Phase 1: Pre-Deployment
- [ ] ✅ Emergency security fix applied
- [ ] ✅ Admin user created
- [ ] ✅ Security tests passed
- [ ] ✅ Frontend code updated
- [ ] ✅ Backup created

### Phase 2: Deployment
- [ ] Deploy updated frontend code
- [ ] Test order creation flow
- [ ] Test payment upload
- [ ] Verify admin dashboard access
- [ ] Check security monitoring

### Phase 3: Post-Deployment Monitoring
- [ ] Monitor error logs for RLS violations
- [ ] Check security_audit_log for unusual activity
- [ ] Verify no public data exposure
- [ ] Test emergency functions work

---

## 🆘 Emergency Procedures

### If Something Breaks
```sql
-- EMERGENCY: Temporarily disable security (use only in emergencies)
SELECT emergency_disable_security();

-- Fix the issue, then re-enable
SELECT emergency_enable_security();
```

### If You Get Locked Out
```sql
-- Create emergency admin access
SELECT create_first_admin('your-emergency-email@domain.com');
```

### If Orders Stop Working
1. Check if RLS is blocking legitimate requests
2. Verify guest_session_id is being set correctly
3. Check the security_audit_log for error details
4. Use emergency functions if needed

---

## 📞 Support Contacts

### Security Issues
- **Immediate Response**: Run emergency functions
- **Investigation**: Check security_audit_log table
- **Recovery**: Use backup and re-apply fixes

### Database Issues
- **Connection Problems**: Check Supabase dashboard
- **Permission Errors**: Verify RLS policies
- **Data Issues**: Check audit logs for changes

---

## ✅ Final Verification

Before marking as complete, ensure:

1. **Critical Security Fixed**
   - [ ] No public write access to sensitive tables
   - [ ] RLS enabled on all tables
   - [ ] Admin user created and tested
   - [ ] Audit logging working

2. **Functionality Maintained**
   - [ ] Order creation works
   - [ ] Payment upload works
   - [ ] Order status updates work (for staff)
   - [ ] No customer impact

3. **Monitoring Active**
   - [ ] Security audit logs being created
   - [ ] Emergency functions accessible
   - [ ] Daily checks scheduled

**Security Status: 🔴 CRITICAL → 🟡 SECURE WITH MONITORING**

The critical vulnerabilities have been patched, but ongoing monitoring and Phase 2-5 improvements should be implemented soon. 