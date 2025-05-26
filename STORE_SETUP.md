# 🏪 Store Setup Guide - Jenny's Pudding

## 📍 **Pickup Location Configuration**

To get accurate delivery pricing from Lalamove, you need to configure your store's pickup location.

### **1. Environment Variables Setup**

Create a `.env.local` file in your project root with the following configuration:

```env
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Lalamove API Configuration  
LALAMOVE_API_KEY=your_lalamove_api_key_here
LALAMOVE_API_SECRET=your_lalamove_api_secret_here

# Store Pickup Location Configuration
# Replace these with your actual Jenny's Pudding store details
STORE_PICKUP_LAT=-6.2088
STORE_PICKUP_LNG=106.8456
STORE_PICKUP_ADDRESS=Jenny's Pudding Store, Jl. Example Street No. 123, Jakarta
STORE_NAME=Jenny's Pudding
STORE_PHONE=+62123456789
```

### **2. How to Get Your Store Coordinates**

#### **Option A: Use Google Maps**
1. Go to [Google Maps](https://maps.google.com)
2. Search for your store address
3. Right-click on your store location
4. Click "What's here?"
5. Copy the coordinates (lat, lng) that appear

#### **Option B: Use the Interactive Map**
1. Run your app: `npm run dev`
2. Go to `/customer-info` page
3. Click "Lokasi Saya" button on the map
4. The coordinates will be displayed
5. Copy the lat/lng values

### **3. Store Information Required**

| Variable | Description | Example |
|----------|-------------|---------|
| `STORE_PICKUP_LAT` | Store latitude coordinate | `-6.2088` |
| `STORE_PICKUP_LNG` | Store longitude coordinate | `106.8456` |
| `STORE_PICKUP_ADDRESS` | Full store address | `Jenny's Pudding Store, Jl. Sudirman No. 123, Jakarta` |
| `STORE_NAME` | Store name for delivery | `Jenny's Pudding` |
| `STORE_PHONE` | Store contact number | `+62123456789` |

### **4. API Keys Setup**

#### **Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Maps JavaScript API and Places API
4. Create credentials (API Key)
5. Restrict the key to your domain for security

#### **Lalamove API Credentials**
1. Register at [Lalamove Developer Portal](https://developers.lalamove.com)
2. Create a new application
3. Get your API Key and API Secret
4. Start with sandbox environment for testing

### **5. Testing Your Setup**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the map:**
   - Go to `/customer-info`
   - The Google Maps should load properly
   - "Lokasi Saya" button should work

3. **Test delivery quotation:**
   - Fill in customer information
   - Select a delivery location
   - You should see real delivery pricing

### **6. Production Deployment**

When deploying to production:

1. **Update environment variables** in your hosting platform
2. **Switch Lalamove to production mode** by updating the base URL
3. **Secure your API keys** - never commit them to version control
4. **Test thoroughly** with real addresses

### **7. Troubleshooting**

#### **Map not loading:**
- Check if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Verify the API key has proper permissions
- Check browser console for errors

#### **No delivery pricing:**
- Verify Lalamove API credentials
- Check if store coordinates are correct
- Look at network tab for API errors

#### **Mock pricing showing:**
- This means Lalamove API is not configured
- Check your API key and secret
- Verify the store pickup location is set

### **8. Cost Optimization**

- **Google Maps**: Monitor usage to stay within free tier
- **Lalamove**: Test with sandbox first, then switch to production
- **Geocoding**: Cache results to reduce API calls

---

## 🚀 **Quick Start**

1. Copy the environment template above
2. Replace with your actual store details
3. Get your coordinates using Google Maps
4. Set up API keys
5. Test the delivery flow

Your delivery system will now calculate accurate pricing based on the distance from your actual store location to the customer's delivery address! 🎉 