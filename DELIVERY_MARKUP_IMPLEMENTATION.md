# Delivery Markup & Optional Toll Road Implementation

## Overview
A comprehensive pricing system has been implemented for delivery services with both hidden markup for profit margins and **optional** toll road charges as a customer service choice. The system works for both express and main store deliveries.

## Pricing Rules

### Hidden Markup (Customer-Only)
- **Motor Delivery (MOTORCYCLE)**: +Rp 3,000
- **Car Delivery (CAR/SEDAN)**: +Rp 5,000  
- **Other vehicles** (VAN, TRUCK): No markup

### Optional Toll Road Charges (Customer Choice Only)
- **Car/Sedan Deliveries Only**: +Rp 25,000 (when customer chooses "Pakai Tol")
- **Shows in price breakdown** only when selected
- **Motorcycle/Van/Truck**: Option not available/ignored
- **Frontend should show toll option** only when car/sedan is selected

## Implementation Details

### Customer-Facing Application
**File:** `jennys-pudding/app/api/lalamove/quotation/route.ts`

The pricing is applied in this order:
1. Get original Lalamove quotation
2. Apply hidden markup (motor +3k, car +5k)
3. Apply toll road charges **ONLY if customer chooses** (+25k for car/sedan)
4. Return final price with toll breakdown only if applied

```javascript
// Hidden markup (not shown to customer)
function applyDeliveryMarkup(originalPrice: number, serviceType: string): number {
  let markup = 0;
  if (serviceType === 'MOTORCYCLE') markup = 3000;
  else if (serviceType === 'CAR' || serviceType === 'SEDAN') markup = 5000;
  return originalPrice + markup;
}

// Optional toll road charges (only when customer chooses)
function applyTollRoadCharges(basePrice: number, serviceType: string, useTollRoad: boolean) {
  let tollCharge = 0;
  if (useTollRoad && (serviceType === 'CAR' || serviceType === 'SEDAN')) {
    tollCharge = 25000; // Only applied when customer chooses
  }
  return { finalPrice: basePrice + tollCharge, tollCharge };
}
```

### Admin Application  
**File:** `admin-app/src/app/api/lalamove/quotation/route.ts`

**No markup and no toll road functionality** for admin interface. Admins see original Lalamove prices only.

```javascript
// Admin sees: Original Lalamove price only
// Admin does NOT see: Hidden markup or toll road options
```

## Store Coverage
- ✅ **Express Store**: Markup and optional toll charges applied
- ✅ **Main Store**: Markup and optional toll charges applied
- Both stores use the same pricing logic

## Customer Experience
- Customers see only the final delivery price
- **Toll road option** available ONLY for car/sedan deliveries
- Option should be hidden/disabled for motorcycle selections
- Price breakdown shows: "Pakai Tol: Rp 25,000" (only when customer chooses)
- Hidden markup is never shown in any breakdown

## Admin Experience  
- Admins see actual Lalamove costs only
- **No toll road options** in admin interface
- **No hidden markup** shown or applied
- Clean cost visibility for business management

## Example Pricing

### Customer View (with markup + optional toll):
- Motor delivery (5km): Rp 15,400 → **Rp 18,400** (hidden markup applied)
- Car delivery (5km): Rp 45,500 → **Rp 50,500** (hidden markup applied)  
- Car delivery (5km) + **Customer chooses toll**: Rp 45,500 → **Rp 75,500** (markup + toll)

### Admin View (original cost only):
- Motor delivery (5km): **Rp 15,400** (actual Lalamove cost)
- Car delivery (5km): **Rp 45,500** (actual Lalamove cost)
- No toll road options available in admin

## API Parameters

### Customer API Request:
```json
{
  "deliveryAddress": "...",
  "serviceType": "CAR",
  "useTollRoad": true,     // Optional - customer choice
  "isExpress": false
}
```

### Response Format (with toll selected):
```json
{
  "success": true,
  "quotation": {
    "id": "...",
    "price": {
      "total": "75500",
      "currency": "IDR"
    },
    "tollCharge": {        // Only present when toll is applied
      "value": "25000", 
      "currency": "IDR"
    },
    "hasTollRoad": true    // Boolean flag
  }
}
```

### Response Format (no toll selected):
```json
{
  "success": true,
  "quotation": {
    "id": "...",
    "price": {
      "total": "50500",
      "currency": "IDR"
    },
    "hasTollRoad": false   // No tollCharge property
  }
}
```

## Frontend Implementation Notes
- **Toll road checkbox/toggle** should only appear when "Mobil" is selected
- Should be hidden/disabled for "Motor" selection
- Default to unchecked (toll road is optional)
- Update quotation when toll option is changed

## Files Modified
1. `jennys-pudding/app/api/lalamove/quotation/route.ts` - Added markup + optional toll logic
2. `admin-app/src/app/api/lalamove/quotation/route.ts` - Removed toll functionality completely
3. `jennys-pudding/test-delivery-markup.js` - Updated test script

## Testing
Run the comprehensive test script:
```bash
node jennys-pudding/test-delivery-markup.js
```

## Logging
The system logs markup and optional toll charges:
```
🚗 Toll road option requested: YES
Hidden markup applied: { serviceType: 'CAR', ... }
🚗 OPTIONAL toll road charges applied (customer choice): { ... }
```

## Benefits
- ✅ Hidden profit margin on all deliveries (both stores)
- ✅ **Optional** toll road service (customer choice only)
- ✅ Customer-friendly pricing (markup hidden, toll optional & transparent)
- ✅ Admin simplicity (see actual costs only, no extra features)
- ✅ Consistent across all quotation scenarios  
- ✅ Works for both Express and Main store
- ✅ Clean UI logic (toll option only for car/sedan)
- ✅ Proper logging for debugging and monitoring

## Business Logic Summary
1. **Customer pays**: Lalamove price + Hidden markup + Toll (only if they choose)
2. **Admin sees**: Lalamove price only (clean and simple)
3. **Business profit**: Hidden markup amount
4. **Service transparency**: Toll charges shown only when customer selects the option 