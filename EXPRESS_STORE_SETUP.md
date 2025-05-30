# Express Store Setup Guide

This guide explains how to implement the Express Store functionality for same-day delivery from Jenny's Pudding physical store.

## Overview

The Express Store feature allows customers to order products that are available for same-day delivery from a physical store location. This includes:

- Separate inventory tracking for express items
- Express-only product catalog
- Same-day delivery time slots
- Express order management for admin

## 🚀 Quick Implementation

### 1. Database Migration

Run the SQL migration script to add the necessary columns and functions:

```sql
-- Apply the migration
-- Run the contents of express-store-migration.sql in your Supabase SQL editor
```

**Important:** Run this migration in your Supabase dashboard's SQL editor or via your preferred database tool.

### 2. Install Dependencies

The required dependencies should already be installed, but ensure you have:

```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables

Make sure your environment variables are set up in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📋 Database Schema Changes

### Products Table
New columns added:
- `is_express_item` (boolean): Flag indicating if product is available for express delivery
- `express_stock_quantity` (integer): Current stock available for express orders

### Orders Table
New column added:
- `is_express_order` (boolean): Flag indicating if order is for express delivery

### New Functions
- `get_express_products()`: Returns available express products with stock > 0
- `update_express_stock()`: Updates stock when express order is placed
- `get_express_orders()`: Returns all express orders for admin

## 💻 Frontend Implementation

### 1. Update Product Catalog

To show express availability on the product catalog page:

```typescript
// In your product catalog component
import { ExpressService } from '@/lib/express-service';

// Check if product is available for express delivery
const isExpressAvailable = product.is_express_item && product.express_stock_quantity > 0;

// Add express badge to product card
{isExpressAvailable && (
  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
    Express Available
  </div>
)}
```

### 2. Express Product Section

Create a dedicated express section:

```typescript
// components/ExpressProductSection.tsx
import { ExpressService } from '@/lib/express-service';
import { ExpressProduct } from '@/lib/types/express';

export function ExpressProductSection() {
  const [expressProducts, setExpressProducts] = useState<ExpressProduct[]>([]);

  useEffect(() => {
    const loadExpressProducts = async () => {
      try {
        const products = await ExpressService.getExpressProducts();
        setExpressProducts(products);
      } catch (error) {
        console.error('Failed to load express products:', error);
      }
    };

    loadExpressProducts();
  }, []);

  return (
    <div className="express-section">
      <h2 className="text-xl font-bold mb-4">Tersedia Hari Ini - Express Delivery</h2>
      <div className="grid grid-cols-2 gap-4">
        {expressProducts.map(product => (
          <ProductCard key={product.id} product={product} isExpress={true} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Express Checkout Flow

Modify the checkout process to handle express orders:

```typescript
// In your checkout component
import { ExpressService } from '@/lib/express-service';

const handleExpressOrder = async (orderData: any) => {
  try {
    // Check if express delivery is available
    if (!ExpressService.isExpressDeliveryAvailable()) {
      alert('Express delivery tidak tersedia saat ini');
      return;
    }

    // Check minimum order
    const total = calculateTotal();
    if (total < ExpressService.getExpressMinimumOrder()) {
      alert(`Minimum order untuk express delivery: Rp ${ExpressService.getExpressMinimumOrder().toLocaleString()}`);
      return;
    }

    // Create express order
    const order = await ExpressService.createExpressOrder({
      ...orderData,
      delivery_date: new Date().toISOString().split('T')[0], // Today
    });

    router.push(`/thank-you?orderId=${order.id}&express=true`);
  } catch (error) {
    console.error('Failed to create express order:', error);
    alert('Gagal membuat pesanan express');
  }
};
```

## 👨‍💼 Admin Implementation

### 1. Express Product Management

Add express controls to the admin product management:

```typescript
// In admin product form
const [isExpressItem, setIsExpressItem] = useState(false);
const [expressStock, setExpressStock] = useState(0);

const handleUpdateExpressInfo = async (productId: string) => {
  try {
    await ExpressService.updateProductExpressInfo(
      productId,
      isExpressItem,
      expressStock
    );
    alert('Express info updated successfully');
  } catch (error) {
    console.error('Failed to update express info:', error);
  }
};
```

### 2. Express Order Dashboard

Create an express orders dashboard:

```typescript
// components/admin/ExpressOrdersDashboard.tsx
import { ExpressService } from '@/lib/express-service';

export function ExpressOrdersDashboard() {
  const [expressOrders, setExpressOrders] = useState([]);

  useEffect(() => {
    const loadExpressOrders = async () => {
      const orders = await ExpressService.getTodayExpressOrders();
      setExpressOrders(orders);
    };

    loadExpressOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await ExpressService.updateExpressOrderStatus(orderId, status);
      // Refresh orders
      const orders = await ExpressService.getTodayExpressOrders();
      setExpressOrders(orders);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  return (
    <div className="express-orders-dashboard">
      <h2 className="text-xl font-bold mb-4">Express Orders Today</h2>
      {/* Render express orders with status controls */}
    </div>
  );
}
```

## 🎨 UI Considerations

### Express Badges
Add visual indicators for express items:

```css
.express-badge {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.express-available {
  border: 2px solid #10b981;
  position: relative;
}

.express-available::before {
  content: "⚡ Express";
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #10b981;
  color: white;
  font-size: 0.6rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
```

### Dark/Light Theme Support
Ensure express elements follow your theme:

```typescript
// Use your existing theme hook
const { theme } = useTheme();

const expressBadgeClass = `
  ${theme === 'dark' 
    ? 'bg-green-600 dark:bg-green-500' 
    : 'bg-green-500'
  } text-white text-xs px-2 py-1 rounded-full
`;
```

## 📱 Mobile Optimization

All express components should be mobile-friendly:

```css
/* Mobile-first responsive design */
.express-section {
  padding: 1rem;
}

@media (min-width: 768px) {
  .express-section {
    padding: 2rem;
  }
}

.express-time-slots {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .express-time-slots {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🔐 Security Notes

1. **RLS Policies**: The migration includes proper RLS policies to ensure only admin users can modify express settings
2. **Stock Validation**: Always validate stock availability before allowing orders
3. **Time Validation**: Verify that express delivery is available based on current time and day
4. **Admin Authorization**: Ensure only authenticated admin users can access express management features

## 🚀 Deployment

1. Run the migration in production Supabase
2. Deploy the updated code
3. Test express functionality thoroughly
4. Configure admin users in Supabase Auth

## 📊 Monitoring

Track these metrics for express orders:
- Express order conversion rate
- Average express order value
- Express delivery completion rate
- Stock turnover for express items

## 🆘 Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure all table dependencies exist before running migration
2. **Permission Errors**: Verify RLS policies and admin user emails
3. **Stock Issues**: Check that express stock is properly updated after orders
4. **Time Zone Issues**: Ensure proper time zone handling for delivery cutoffs

### Error Messages in Bahasa Indonesia

```typescript
const ERROR_MESSAGES = {
  STOCK_UNAVAILABLE: 'Stok express tidak tersedia',
  TIME_CUTOFF: 'Waktu pemesanan express sudah berakhir',
  MINIMUM_ORDER: 'Minimum order tidak terpenuhi',
  DELIVERY_UNAVAILABLE: 'Express delivery tidak tersedia hari ini',
};
```

This completes the Express Store implementation. The system now supports same-day delivery with proper inventory management and admin controls. 