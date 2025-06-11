# Size and Customization Features Test Documentation

## Overview
This document outlines how to test the customization features implemented:
- Size selection for Pudding Tart category (ID: `603c267a-f47d-420f-a28c-6a797360ddff`)
- Flavor and color selection for Pudding Flower Bouquet category (ID: `aebc65b1-b9d6-4b23-a979-92b3e552627f`)

## Test Scenarios

### 1. Size Selection Tests (Pudding Tart Category)

#### 1.1 Size Options Display
- **Test**: Navigate to a Pudding Tart product detail page
- **Expected**: Size selection section appears with two options:
  - Diameter 15 cm (Normal)
  - Diameter 20 cm (+Rp 160,000)
- **Verify**: Default selection is 15 cm
- **Verify**: Options are displayed as radio buttons with clear pricing

#### 1.2 Price Calculation with Size
- **Test**: Select different sizes and observe price changes
- **Expected**: 
  - Base price shown for 15 cm selection
  - Price increases by Rp 160,000 when 20 cm is selected
  - Total calculation: (base price + size premium + add-ons) × quantity

#### 1.3 Cart Integration with Size
- **Test**: Add items with different sizes to cart
- **Expected**:
  - Same product with different sizes treated as separate items
  - Size information displayed in cart
  - Correct pricing maintained in cart

### 2. Flavor and Color Selection Tests (Pudding Flower Bouquet Category)

#### 2.1 Flavor Options Display
- **Test**: Navigate to a Pudding Flower Bouquet product detail page
- **Expected**: Flavor selection section with 3 options:
  - Choco (Rich chocolate flavor)
  - Mocca (Coffee and chocolate blend)
  - Taro (Sweet purple yam flavor)
- **Verify**: Default selection is Choco
- **Verify**: Grid layout with 3 columns

#### 2.2 Color Options Display
- **Test**: Check color selection section
- **Expected**: Color selection with 11 options:
  - Pink 🌸 (with pink color circle)
  - Blue 💙 (with blue color circle)
  - Purple 💜 (with purple color circle)
  - Red ❤️ (with red color circle)
  - Orange 🧡 (with orange color circle)
  - Pink Red 🌺 (with gradient color circle)
  - Pink Blue 🌷 (with gradient color circle)
  - Pink Sunset 🌻 (with gradient color circle)
  - Pink Purple 🌼 (with gradient color circle)
  - Purple Blue 💐 (with gradient color circle)
  - Purple Red 🌹 (with gradient color circle)
- **Verify**: Default selection is Pink
- **Verify**: Responsive grid layout (3 cols mobile, 4 cols tablet, 6 cols desktop)
- **Verify**: Gradient colors display properly as linear gradients

#### 2.3 Price Calculation with Flavor/Color
- **Test**: Select different flavors and colors
- **Expected**: 
  - No price change for different flavors
  - No price change for different colors
  - Total calculation: (base price + add-ons) × quantity

#### 2.4 Cart Integration with Flavor/Color
- **Test**: Add items with different flavor/color combinations
- **Expected**:
  - Same product with different flavor/color combinations treated as separate items
  - Flavor and color information displayed in cart
  - Correct identification of unique combinations

### 3. Cross-Feature Tests

#### 3.1 Non-Target Categories
- **Test**: Navigate to products NOT in Pudding Tart or Pudding Flower Bouquet categories
- **Expected**: 
  - No size selection appears
  - No flavor/color selection appears
  - Original product display maintained

#### 3.2 Express vs Regular Product Pages
- **Test**: Compare customization options between regular and express product pages
- **Expected**: Same customization options available on both pages with consistent styling

#### 3.3 Cart Display Consistency
- **Test**: Add customized items and check cart display
- **Expected**:
  - Regular cart shows customizations clearly
  - Express cart shows customizations with gradient styling
  - All customization details preserved

### 4. Edge Cases

#### 4.1 Multiple Add-ons with Customizations
- **Test**: Add products with multiple add-ons plus customizations
- **Expected**: All options correctly calculated and displayed

#### 4.2 Quantity Changes with Customizations
- **Test**: Change quantity for customized items
- **Expected**: Total price correctly recalculated

#### 4.3 Browser Refresh/Navigation
- **Test**: Refresh page or navigate back/forward
- **Expected**: Default selections restored, cart maintains customized items

### 5. Implementation Details

#### Files Modified:
1. `ProductDetailClient.tsx` - Added size, flavor, and color selection interfaces
2. `ExpressProductDetailClient.tsx` - Added same customization options for express products  
3. `CartContext.tsx` - Extended CartItem interface and duplicate detection logic
4. `cart/page.tsx` - Added customization display in regular cart
5. `express-cart/page.tsx` - Added customization display in express cart

#### Constants Added:
- `PUDDING_TART_CATEGORY_ID`: "603c267a-f47d-420f-a28c-6a797360ddff"
- `PUDDING_FLOWER_BOUQUET_CATEGORY_ID`: "aebc65b1-b9d6-4b23-a979-92b3e552627f"
- `PUDDING_TART_SIZE_OPTIONS`: Array of size options with pricing
- `PUDDING_FLOWER_BOUQUET_FLAVORS`: Array of flavor options
- `PUDDING_FLOWER_BOUQUET_COLORS`: Array of color options with visual properties

#### Cart Logic:
- Items with different customizations are treated as separate cart items
- Duplicate detection checks: id + size + flavor + color + add-ons + source
- Price calculation includes size premiums but not flavor/color premiums

### 6. Manual Testing Steps

1. **Setup**: Ensure you have products with the correct category IDs
2. **Size Testing**: Test Pudding Tart products for size functionality
3. **Flavor/Color Testing**: Test Pudding Flower Bouquet products for customization
4. **Cart Testing**: Add various combinations and verify cart behavior
5. **Cross-browser Testing**: Test on different browsers for consistency
6. **Mobile Testing**: Verify responsive design on mobile devices

### 7. Free Vla Bonus Information

#### 7.1 Free Vla Display
- **Test**: Navigate to products in categories with free vla bonus
- **Category IDs**: 
  - fc2d5e2c-1e09-4e7c-8768-409f2ee8ec72
  - 4e692cca-aec9-4fe4-97dc-6066a27fcec4
  - 603c267a-f47d-420f-a28c-6a797360ddff
  - c1027fbf-ea84-479d-8721-d773dd3ec2a6
  - aebc65b1-b9d6-4b23-a979-92b3e552627f
- **Expected**: 
  - Green info box displays below price section
  - Shows "Free Bonus!" header with bottle emoji 🍼
  - Text: "Free 1 Botol Vla (250ml) / pudding"
- **Verify**: Information is display-only and doesn't affect cart
- **Verify**: Same display on both regular and express product pages

### 8. Success Criteria

✅ Size selection works only for Pudding Tart category
✅ Flavor/color selection works only for Pudding Flower Bouquet category  
✅ Price calculations are accurate
✅ Cart correctly handles different customizations as separate items
✅ UI is consistent between regular and express pages
✅ All customization details are preserved and displayed
✅ Free vla bonus information displays for specified categories
✅ No impact on other product categories
✅ Responsive design works on all screen sizes 