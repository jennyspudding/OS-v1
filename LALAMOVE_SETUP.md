# Lalamove Integration Setup

## Overview
This integration allows customers to get real-time delivery quotations from Lalamove when they enter their delivery address.

## Setup Instructions

### 1. Get Lalamove API Credentials
1. Visit [Lalamove Developer Portal](https://developers.lalamove.com/)
2. Sign up for a developer account
3. Create a new application
4. Get your API Key and API Secret

### 2. Environment Variables
Create a `.env.local` file in your project root and add:

```env
LALAMOVE_API_KEY=your_lalamove_api_key_here
LALAMOVE_API_SECRET=your_lalamove_api_secret_here
```

### 3. Store Location Configuration
Update the store coordinates in `/app/api/lalamove/quotation/route.ts`:

```typescript
const storeCoordinates: LalamoveCoordinate = {
  lat: "YOUR_STORE_LATITUDE",
  lng: "YOUR_STORE_LONGITUDE"
};
const storeAddress = "Your Store Address";
```

### 4. How It Works

#### User Flow:
1. Customer fills in delivery address (province, city, district, street)
2. System automatically geocodes the address to coordinates
3. API calls Lalamove to get delivery quotation
4. Real-time pricing and delivery time is displayed
5. Customer can proceed to payment with delivery cost included

#### API Flow:
1. **Address Input** → Customer enters complete address
2. **Geocoding** → Address converted to lat/lng coordinates using OpenStreetMap
3. **Lalamove API** → Quotation request sent with pickup and delivery coordinates
4. **Response** → Delivery price, time, and distance displayed to customer

### 5. Supported Features

- ✅ Real-time delivery pricing
- ✅ Multiple service types (Motorcycle, Car, Van, Truck)
- ✅ Distance calculation
- ✅ Estimated delivery time
- ✅ Quotation validity period (5 minutes as per Lalamove)
- ✅ Auto-refresh when address changes
- ✅ Error handling and retry functionality

### 6. API Endpoints

#### POST `/api/lalamove/quotation`
Request body:
```json
{
  "deliveryAddress": "Full delivery address",
  "recipientName": "Recipient name",
  "recipientPhone": "Recipient phone",
  "serviceType": "MOTORCYCLE" // or CAR, VAN, TRUCK
}
```

Response:
```json
{
  "success": true,
  "quotation": {
    "id": "quotation_id",
    "price": {
      "total": "50000",
      "currency": "IDR"
    },
    "distance": {
      "value": "5000",
      "unit": "m"
    },
    "serviceType": "MOTORCYCLE",
    "estimatedTime": "30-45 menit",
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

### 7. Testing

#### Sandbox Environment
- The integration uses Lalamove sandbox by default in development
- No real charges will be incurred during testing
- Switch to production environment by setting `NODE_ENV=production`

#### Test Addresses
Use these addresses for testing in Indonesia:
- Jakarta: "Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta"
- Tangerang: "Jl. Raya Serpong, Tangerang Selatan, Banten"

### 8. Production Considerations

1. **Rate Limits**: Lalamove has API rate limits (100 requests/minute for production)
2. **Error Handling**: Implement proper error handling for network failures
3. **Caching**: Consider caching quotations for similar addresses
4. **Monitoring**: Monitor API usage and costs
5. **Fallback**: Have a fallback delivery option if Lalamove is unavailable

### 9. Troubleshooting

#### Common Issues:
- **"Could not find coordinates"**: Address might be too vague or incorrect
- **"Failed to get delivery quotation"**: Check API credentials and network connectivity
- **Rate limit errors**: Implement request throttling

#### Debug Mode:
Check browser console and server logs for detailed error messages.

### 10. Next Steps

To complete the integration:
1. Set up your Lalamove developer account
2. Configure your store coordinates
3. Test with real addresses in your delivery area
4. Integrate with your payment system
5. Add order placement functionality using Lalamove's Place Order API 