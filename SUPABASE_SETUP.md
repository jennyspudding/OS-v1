# Jenny's Pudding - Supabase Database Setup

This document explains how to set up and use the Supabase database for Jenny's Pudding order management system.

## 🗄️ Database Schema Overview

The database is designed to handle the complete order lifecycle from cart to delivery, with the following main tables:

### Core Tables

1. **`orders`** - Main order information
2. **`order_items`** - Individual products in each order
3. **`order_item_addons`** - Add-ons for each product
4. **`order_status_history`** - Track status changes
5. **`payment_proofs`** - Payment verification files
6. **`delivery_tracking`** - Real-time delivery updates

## 🚀 Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run the Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

### 3. Configure Storage (for payment proofs)
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `payment-proofs`
3. Set appropriate policies for file uploads

## 📊 Order Status Flow

```
ready_for_payment → payment_uploaded → payment_verified → processing 
→ preparing → ready_for_delivery → out_for_delivery → delivered
```

**Alternative flows:**
- `payment_rejected` (if payment proof is invalid)
- `cancelled` (if order is cancelled)
- `refunded` (if refund is processed)

## 💾 Data Structure

### Order Data Format
The `completeOrderData` from localStorage maps to the database as follows:

```javascript
// Frontend localStorage data
const completeOrderData = {
  formData: {
    name: "John Doe",
    phone: "81234567890",
    recipientName: "Jane Doe", 
    recipientPhone: "81234567891",
    // ... address fields
  },
  cart: {
    items: [
      {
        id: "pudding-1",
        name: "Chocolate Pudding",
        price: 25000,
        quantity: 2,
        addOns: [
          { id: "topping-1", name: "Extra Chocolate", price: 5000 }
        ]
      }
    ]
  },
  cartTotal: 50000,
  deliveryTotal: 15000,
  grandTotal: 65000,
  // ... other fields
}
```

### Database Storage
This data is normalized across multiple tables:
- Main order info → `orders` table
- Cart items → `order_items` table  
- Add-ons → `order_item_addons` table

## 🔧 Key Functions

### Insert Complete Order
Use the provided function to insert a complete order:

```sql
SELECT insert_complete_order('{"order_id": "JP-123456", "formData": {...}, "cart": {...}}');
```

### Query Order with All Details
Use the `order_details` view for complete order information:

```sql
SELECT * FROM order_details WHERE order_id = 'JP-123456';
```

### Update Order Status
Status changes are automatically tracked:

```sql
UPDATE orders SET status = 'payment_verified' WHERE order_id = 'JP-123456';
-- This automatically creates an entry in order_status_history
```

## 🔐 Security Features

### Row Level Security (RLS)
- **Public access**: Can insert orders and read order data
- **Authenticated access**: Can update orders (for admin functions)
- **Policies**: Configured for secure access patterns

### Data Integrity
- **Foreign key constraints**: Ensure data consistency
- **Enum types**: Validate status values and vehicle types
- **Triggers**: Auto-update timestamps and status history

## 📱 Integration with Frontend

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Configure Supabase
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 3. Submit Order from Payment Page
```javascript
// In payment page handleSubmit
const submitOrder = async () => {
  const orderData = JSON.parse(localStorage.getItem('completeOrderData'));
  
  // Add the generated order ID
  orderData.order_id = orderId;
  
  // Insert order into database
  const { data, error } = await supabase.rpc('insert_complete_order', {
    order_data: orderData
  });
  
  if (error) {
    console.error('Error submitting order:', error);
    return;
  }
  
  // Upload payment proof if provided
  if (proofFile) {
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(`${orderId}/${proofFile.name}`, proofFile);
      
    if (!uploadError) {
      // Update order with payment proof URL
      await supabase
        .from('orders')
        .update({ 
          status: 'payment_uploaded',
          payment_proof_url: fileData.path 
        })
        .eq('order_id', orderId);
    }
  }
};
```

### 4. Query Orders for Admin
```javascript
// Get all pending orders
const { data: pendingOrders } = await supabase
  .from('order_details')
  .select('*')
  .eq('status', 'payment_uploaded')
  .order('created_at', { ascending: false });

// Get order history
const { data: orderHistory } = await supabase
  .from('order_status_history')
  .select('*')
  .eq('order_id', orderId)
  .order('created_at', { ascending: true });
```

## 📈 Performance Considerations

### Indexes
The schema includes optimized indexes for:
- Order ID lookups
- Status filtering
- Date range queries
- Customer phone searches

### Views
The `order_details` view provides denormalized data for efficient querying while maintaining normalized storage.

## 🔄 Backup and Maintenance

### Regular Backups
- Supabase provides automatic backups
- Consider additional backups for critical data

### Data Cleanup
- Archive old orders periodically
- Clean up unused payment proof files
- Monitor database size and performance

## 🐛 Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Check if policies allow the required operations
2. **Foreign Key Violations**: Ensure parent records exist before inserting children
3. **JSON Parsing**: Validate JSON structure before using `insert_complete_order`

### Debugging Queries
```sql
-- Check order status history
SELECT * FROM order_status_history WHERE order_id = 'JP-123456';

-- Verify data integrity
SELECT o.order_id, COUNT(oi.id) as item_count 
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
GROUP BY o.id, o.order_id;
```

## 📞 Support

For issues with this schema:
1. Check the Supabase logs in your dashboard
2. Verify your RLS policies
3. Test queries in the SQL Editor
4. Review the schema documentation above

---

**Note**: Remember to update your environment variables with your Supabase credentials and adjust RLS policies based on your authentication requirements. 