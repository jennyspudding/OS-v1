# Test: Pudding Tart Size Options Implementation

## Test Setup
- Category ID: `603c267a-f47d-420f-a28c-6a797360ddff` (Pudding Tart)
- Size Options:
  1. Diameter 15 cm (normal price, +Rp 0)
  2. Diameter 20 cm (add Rp 160,000)

## Test Cases

### 1. Product Detail Page (Regular)
**Test Steps:**
1. Navigate to a Pudding Tart product detail page
2. Verify size options are displayed with radio buttons
3. Check that 15cm is selected by default
4. Select 20cm option and verify price updates (+Rp 160,000)
5. Add to cart and verify size information is included

**Expected Results:**
- ✅ Size options section appears only for Pudding Tart products
- ✅ Price updates correctly when switching sizes
- ✅ Selected size is passed to cart

### 2. Express Product Detail Page
**Test Steps:**
1. Navigate to an Express Pudding Tart product detail page
2. Verify size options are displayed with express styling
3. Check that 15cm is selected by default
4. Select 20cm option and verify price updates
5. Add to express cart and verify size information is included

**Expected Results:**
- ✅ Size options section appears with express gradient styling
- ✅ Price updates correctly when switching sizes
- ✅ Selected size is passed to express cart

### 3. Regular Cart Page
**Test Steps:**
1. Add different sizes of Pudding Tart products to cart
2. Navigate to cart page
3. Verify selected size is displayed for each item
4. Check that size with additional cost shows the price addition

**Expected Results:**
- ✅ Size information displays with 📏 icon
- ✅ Additional cost shown in parentheses for 20cm option
- ✅ No size display for non-Pudding Tart products

### 4. Express Cart Page
**Test Steps:**
1. Add different sizes of Express Pudding Tart products to cart
2. Navigate to express cart page
3. Verify selected size is displayed with express styling
4. Check that size with additional cost shows the price addition

**Expected Results:**
- ✅ Size information displays with gradient background
- ✅ Additional cost shown for 20cm option
- ✅ Express styling maintained

### 5. Cart Logic
**Test Steps:**
1. Add same Pudding Tart product with different sizes
2. Verify they appear as separate cart items
3. Add same product with same size multiple times
4. Verify quantity increases for identical items

**Expected Results:**
- ✅ Different sizes create separate cart items
- ✅ Same size increases quantity
- ✅ Cart properly differentiates by size in findIndex logic

## Implementation Summary

### Files Modified:
1. `app/product/[id]/ProductDetailClient.tsx` - Added size options for regular products
2. `app/express-product/[id]/ExpressProductDetailClient.tsx` - Added size options for express products
3. `components/CartContext.tsx` - Updated CartItem interface and duplicate detection logic
4. `app/cart/page.tsx` - Added size display in regular cart
5. `app/express-cart/page.tsx` - Added size display in express cart

### Key Features:
- ✅ Radio button selection for size options
- ✅ Real-time price updates based on selected size
- ✅ Size-specific cart items (different sizes = different cart entries)
- ✅ Visual size information in cart pages
- ✅ Consistent styling between regular and express versions
- ✅ Backward compatibility (non-Pudding Tart products unaffected)

## Constants Used:
```typescript
const PUDDING_TART_CATEGORY_ID = '603c267a-f47d-420f-a28c-6a797360ddff';

const PUDDING_TART_SIZE_OPTIONS: SizeOption[] = [
  {
    id: '15cm',
    name: 'Diameter 15 cm',
    diameter: '15 cm',
    priceAdd: 0 // normal price
  },
  {
    id: '20cm', 
    name: 'Diameter 20 cm',
    diameter: '20 cm',
    priceAdd: 160000 // add Rp 160,000
  }
];
```

## Notes:
- Size options only appear for products with `category_id === '603c267a-f47d-420f-a28c-6a797360ddff'`
- Default selection is always 15cm (normal price)
- Size information is stored in cart items for order processing
- Implementation maintains separation between regular and express product flows 