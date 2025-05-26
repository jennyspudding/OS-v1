# 🔍 Debug Checklist: Why Pending Orders Aren't Showing

## ✅ What We've Fixed So Far:
1. **Schema Issues**: Fixed VARCHAR length limits with `supabase-schema-fix-simple.sql`
2. **Order Creation**: Orders are successfully going into the `orders` table
3. **Admin App Queries**: Updated admin app to query tables directly instead of the simplified view

## 🔍 What to Check Now:

### Step 1: Check Order Status in Database
1. Open the `debug-orders.html` file in your browser
2. Edit the file and replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual credentials
3. Click "Load Orders" to see all recent orders
4. Check what status your orders actually have

### Step 2: Check Admin App Console
1. Open your admin app at `http://localhost:3000/dashboard/orders/pending`
2. Open browser developer tools (F12)
3. Look for these debug messages:
   ```
   === FETCHING PENDING ORDERS DEBUG ===
   All recent orders: [...]
   Pending orders found: X
   ```

### Step 3: Verify Order Flow
The expected flow is:
1. **Order Created**: Status = `ready_for_payment`
2. **Payment Proof Uploaded**: Status = `payment_uploaded` ← Admin should see these
3. **Admin Approves**: Status = `payment_verified`

## 🚨 Most Likely Issues:

### Issue 1: Orders Stuck at `ready_for_payment`
**Symptoms**: Orders exist but status is still `ready_for_payment`
**Cause**: Payment proof upload or status update failed
**Solution**: Check browser console in payment page for errors

### Issue 2: Admin App Environment Variables
**Symptoms**: Admin app shows "No pending orders found" but orders exist
**Cause**: Admin app not connected to same Supabase project
**Solution**: Copy `.env.local` from jennys-pudding to admin-app folder

### Issue 3: Status Update Function Not Working
**Symptoms**: Orders created but status never changes to `payment_uploaded`
**Cause**: `updateOrderStatus` function failing
**Solution**: Check payment page console for "Order status updated" message

## 🔧 Quick Fixes to Try:

### Fix 1: Copy Environment Variables
```bash
# In your terminal
cp jennys-pudding/.env.local admin-app/.env.local
```

### Fix 2: Restart Admin App
```bash
# Stop the admin app (Ctrl+C) and restart
cd admin-app
npm run dev
```

### Fix 3: Check Payment Page Console
1. Go to payment page in jennys-pudding app
2. Submit an order with payment proof
3. Check console for these messages:
   ```
   Order status updated to payment_uploaded
   Pesanan JP-XXXXXX berhasil dikonfirmasi!
   ```

## 📋 Debug Results Template:

**Order Status Check:**
- [ ] Orders exist in database: Yes/No
- [ ] Order status: `ready_for_payment` / `payment_uploaded` / other
- [ ] Payment proof URL exists: Yes/No

**Admin App Check:**
- [ ] Admin app loads without errors: Yes/No
- [ ] Console shows "All recent orders": Yes/No
- [ ] Console shows "Pending orders found: X": Yes/No
- [ ] Environment variables configured: Yes/No

**Payment Flow Check:**
- [ ] Payment submission works: Yes/No
- [ ] Status update message appears: Yes/No
- [ ] Order appears in admin after submission: Yes/No

## 🎯 Next Steps Based on Results:

1. **If orders exist but wrong status**: Fix payment page status update
2. **If admin app shows errors**: Fix environment variables
3. **If no orders in database**: Fix order creation process
4. **If orders exist with correct status but admin doesn't show**: Fix admin app queries

Share your debug results and I'll help you fix the specific issue! 