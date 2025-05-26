# 🚚 Lalamove API Structure Update

## ✅ **Updated to Correct JSON Format**

The Lalamove API integration has been updated to match the exact JSON structure you provided.

## 🔄 **Changes Made**

### **Before (Old Structure)**
```json
{
  "market": "ID JKT",
  "serviceType": "MOTORCYCLE",
  "language": "id_ID",
  "stops": [
    {
      "lat": -6.217825,
      "lng": 106.818685,
      "address": "Address here"
    }
  ],
  "item": { ... },
  "specialRequests": ["FRAGILE"]
}
```

### **After (Correct Structure)**
```json
{
  "data": {
    "scheduleAt": "2025-05-26T08:56:19.007Z",
    "serviceType": "MOTORCYCLE",
    "specialRequests": [],
    "language": "id_ID",
    "stops": [
      {
        "coordinates": {
          "lat": "-6.217825",
          "lng": "106.818685"
        },
        "address": "Menara Standard Chartered, Jl. Prof. DR. Satrio No.164, RT.3/RW.4, Karet Semanggi, Setia Budi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12940, Indonesia"
      },
      {
        "coordinates": {
          "lat": "-6.127968",
          "lng": "106.650878"
        },
        "address": "Tangerang City, Banten 19120, Indonesia"
      }
    ],
    "isRouteOptimized": true
  }
}
```

## 🛠️ **Technical Updates**

### **Interface Changes**
1. **LalamoveStop Interface**:
   ```typescript
   // OLD
   export interface LalamoveStop {
     lat: number;
     lng: number;
     address: string;
   }
   
   // NEW
   export interface LalamoveStop {
     coordinates: {
       lat: string;
       lng: string;
     };
     address: string;
   }
   ```

2. **LalamoveQuotationRequest Interface**:
   ```typescript
   // Removed: market, item fields
   // Added: scheduleAt at top level
   // Coordinates now as string values in nested object
   ```

### **Function Updates**
- **createDeliveryQuotationRequest()**: Updated to use coordinates object
- **getLalamoveQuotation()**: Updated validation to use coordinates.lat/lng
- **Coordinate conversion**: Numbers converted to strings for API

## 📋 **Key Features**

### **Coordinates Structure**
- ✅ **Nested coordinates object** with lat/lng as strings
- ✅ **Proper validation** for Indonesian coordinates
- ✅ **Automatic conversion** from number to string format

### **Request Structure**
- ✅ **scheduleAt field** with ISO 8601 timestamp
- ✅ **serviceType** (MOTORCYCLE, CAR, VAN, TRUCK)
- ✅ **specialRequests** array (empty by default)
- ✅ **language** set to "id_ID" for Indonesian
- ✅ **isRouteOptimized** set to true

### **Removed Fields**
- ❌ **market** field (not needed in new structure)
- ❌ **item** object (not in your template)
- ❌ **Complex special requests** (simplified to empty array)

## 🔧 **Usage Example**

The updated API will now send requests in this exact format:

```json
{
  "data": {
    "scheduleAt": "2025-05-26T08:56:19.007Z",
    "serviceType": "MOTORCYCLE",
    "specialRequests": [],
    "language": "id_ID",
    "stops": [
      {
        "coordinates": {
          "lat": "-6.217825",
          "lng": "106.818685"
        },
        "address": "Jenny's Pudding Store Location"
      },
      {
        "coordinates": {
          "lat": "-6.127968",
          "lng": "106.650878"
        },
        "address": "Customer Delivery Address"
      }
    ],
    "isRouteOptimized": true
  }
}
```

## ✅ **Testing Ready**

The Lalamove integration is now updated and ready for testing with:
- ✅ **Correct JSON structure** matching your template
- ✅ **Proper coordinate format** (strings in nested object)
- ✅ **Indonesian market support** (id_ID language)
- ✅ **Route optimization** enabled
- ✅ **Motorcycle service** as default

## 🚀 **Next Steps**

1. **Test the API** with real Lalamove credentials
2. **Verify quotation responses** match expected format
3. **Check delivery cost calculations** are accurate
4. **Ensure coordinate validation** works for Indonesian addresses

The delivery cost calculation in your Jenny's Pudding app will now use the correct Lalamove API format! 🍮🚚 