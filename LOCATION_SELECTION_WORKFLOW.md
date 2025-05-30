# 📍 Location Selection Workflow - COMPLETE GUIDE

## 🎯 **What Happens When You Select a New Location**

When you click on the map or search for a new address, the following sequence occurs **automatically**:

### **1. 🗺️ Map Interaction**
- **Click on map** → Gets coordinates and reverse geocodes to address
- **Search address** → Gets coordinates from address
- **Use GPS** → Gets your exact coordinates and reverse geocodes
- **Drag marker** → Updates coordinates and reverse geocodes

### **2. ✅ Automatic Field Updates**

The `handleLocationSelect` function automatically updates **ALL** relevant fields:

```typescript
// 📍 What gets updated automatically:
setSelectedLocation(location);           // ← Updates "Lokasi Terpilih" display
setMapCenter({ lat, lng });             // ← Centers map on new location  
setAlamatLengkap(location.address);     // ← Fills "Alamat Lengkap" textarea
setFormData(prev => ({...locationData})); // ← Updates province/city/district
setDeliveryQuotation(null);             // ← Clears old delivery quote
setVehicleType('MOTORCYCLE');           // ← Resets to motorcycle
```

### **3. 🚀 Auto-Delivery Calculation**

After location update, the system **automatically**:
1. **Waits 1.5 seconds** (to prevent spam calculations)
2. **Triggers delivery quotation** with new coordinates
3. **Shows loading spinner** "Menghitung biaya pengiriman..."
4. **Displays result** with cost, distance, and vehicle type

## 📋 **Fields That Get Updated**

### **✅ "Lokasi Terpilih" Section**
- Shows coordinates and full address
- Displays in pink background box
- Updates immediately when location changes

### **✅ "Alamat Lengkap" Textarea**
- Auto-filled with complete address from map
- User can edit if needed
- Required for order submission

### **✅ Form Location Data**
- Province (extracted from address)
- City (extracted from address) 
- District (extracted from address)
- Postal Code (extracted from address)

### **✅ Delivery Information**
- Clears old quotation
- Calculates new delivery cost
- Shows distance and estimated price
- Resets to motorcycle (fastest option)

## 🔄 **Auto-Calculation Logic**

The delivery calculation triggers automatically when:
```typescript
// Conditions for auto-calculation:
selectedLocation && isDataLoaded && !deliveryQuotation && !isLoadingQuotation
```

This means:
- ✅ Location is selected
- ✅ Component is fully loaded
- ✅ No existing quotation (cleared when location changes)
- ✅ Not currently calculating

## 🎯 **User Experience Flow**

1. **User clicks map** → "🗺️ NEW LOCATION SELECTED"
2. **Fields update** → "✅ Updated selectedLocation/alamatLengkap/formData"
3. **Quotation clears** → "✅ Cleared existing delivery quotation"
4. **Auto-calc starts** → "🚀 Location update complete - auto-calculation should trigger"
5. **Loading shows** → "Menghitung biaya pengiriman..."
6. **Result displays** → Delivery cost, distance, vehicle type

## 🔧 **Debug Information**

When you select a location, check browser console for:
```
🗺️ NEW LOCATION SELECTED - Updating all fields:
- Coordinates: -6.1751, 106.8650
- Address: Jl. Example Street, Jakarta, Indonesia
✅ Updated selectedLocation state
✅ Updated mapCenter state  
✅ Updated alamatLengkap state: Jl. Example Street, Jakarta, Indonesia
✅ Updated formData with location data: {province: "DKI JAKARTA", city: "JAKARTA PUSAT"...}
✅ Cleared existing delivery quotation - will trigger auto-calculation
✅ Reset vehicle type to MOTORCYCLE
🚀 Location update complete - auto-calculation should trigger within 1.5 seconds
```

## ✅ **Expected Behavior**

After selecting a new location, you should see:

1. **"Lokasi Terpilih"** box updates with new address
2. **"Alamat Lengkap"** textarea fills with complete address
3. **"Informasi Pengiriman"** section shows loading spinner
4. **Delivery cost** appears within 5 seconds
5. **Vehicle type** defaults to "Motor"

## 🚨 **If Something Doesn't Work**

Check that:
- ✅ Google Maps API key is configured
- ✅ Internet connection is stable  
- ✅ Location is within Indonesia
- ✅ Browser console shows the debug messages above
- ✅ No JavaScript errors in console

The system is designed to work **seamlessly** - just click the map and everything updates automatically! 🎉 