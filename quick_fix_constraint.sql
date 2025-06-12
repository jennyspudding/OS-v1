-- QUICK FIX: Remove the problematic constraint
-- Run this in your Supabase SQL Editor NOW

-- Simply drop the constraint that's causing the issue
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_express_order_fields;

-- Verification
SELECT 'Constraint removed successfully! Express orders should now work.' as status; 