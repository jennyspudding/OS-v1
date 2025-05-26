# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Google Maps API
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Lalamove API Configuration
```env
LALAMOVE_API_KEY=your_lalamove_api_key_here
LALAMOVE_API_SECRET=your_lalamove_api_secret_here
```

### Jenny's Pudding Store Configuration
**IMPORTANT**: Update these coordinates with your actual store location!

```env
# Store Location (Currently set to Jakarta Central - UPDATE THESE!)
STORE_PICKUP_LAT=-6.2088
STORE_PICKUP_LNG=106.8456
STORE_PICKUP_ADDRESS=Jenny's Pudding Store, Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220, Indonesia
STORE_NAME=Jenny's Pudding
STORE_PHONE=+6281234567890

# Optional: Store Business Information
STORE_BUSINESS_HOURS=09:00-21:00
STORE_DELIVERY_RADIUS=25
```

## How to Get Your Store Coordinates

1. **Using Google Maps**:
   - Go to [Google Maps](https://maps.google.com)
   - Search for your store address
   - Right-click on the exact location
   - Click "What's here?"
   - Copy the coordinates (latitude, longitude)

2. **Using the App**:
   - Open the customer info page
   - Use the map to find your store location
   - Click on the exact spot
   - Check the browser console for coordinates

## Current Distance Calculation

The app now calculates real distances between your store and customer locations using the Haversine formula. This ensures:

- **Accurate pricing** based on actual distance
- **Realistic delivery estimates**
- **Proper quotations** even when Lalamove API is unavailable

## Pricing Formula

**Base Price + (Distance × Rate per KM)**

- Motorcycle: Rp 8,000 base + Rp 2,000/km
- Car: Rp 15,000 base + Rp 3,000/km
- Van: Rp 25,000 base + Rp 3,000/km
- Truck: Rp 35,000 base + Rp 3,000/km

Prices are rounded to the nearest Rp 500.

## Testing

1. **Without API credentials**: App will use calculated mock quotations
2. **With API credentials**: App will try Lalamove API first, fallback to calculated quotations
3. **Invalid market error**: App will use calculated quotations with real distance

## Important Notes

- Always update `STORE_PICKUP_LAT` and `STORE_PICKUP_LNG` with your actual store coordinates
- The default coordinates (-6.2088, 106.8456) are in Jakarta Central area
- Ensure coordinates are within Indonesia bounds for validation to pass
- Test the distance calculation by selecting different delivery locations 