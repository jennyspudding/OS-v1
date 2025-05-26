# Google Maps API Setup Guide

## Overview
The customer info page now includes an interactive Google Maps component that allows customers to:
- Search for specific locations
- Use their current GPS location
- Drag the map marker to select precise delivery coordinates
- Automatically center the map based on selected province/city/district

## Required API Key

You need to obtain a Google Maps API key with the following APIs enabled:
- **Maps JavaScript API** - For displaying the interactive map
- **Places API** - For location search and autocomplete
- **Geocoding API** - For converting addresses to coordinates

## Setup Steps

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the required APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add:

```env
# Google Maps API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Existing Lalamove Configuration
LALAMOVE_API_KEY=your_lalamove_api_key_here
LALAMOVE_API_SECRET=your_lalamove_api_secret_here
```

### 3. API Key Restrictions (Recommended)
For security, restrict your API key:
- **Application restrictions**: HTTP referrers (web sites)
- **Website restrictions**: Add your domain (e.g., `yourdomain.com/*`)
- **API restrictions**: Restrict to only the APIs you need

## Features

### Interactive Map Component
- **Search Bar**: Customers can search for specific addresses or places
- **Current Location**: "Use My Location" button to get GPS coordinates
- **Draggable Marker**: Click and drag to select precise delivery location
- **Auto-centering**: Map automatically centers when province/city is selected

### Integration with Lalamove
- Precise coordinates from map selection are used for delivery quotations
- More accurate pricing and delivery time estimates
- Better route calculation for delivery drivers

### User Experience Flow
1. Customer fills in basic address information (province, city, district)
2. Map automatically centers to that area
3. Customer can:
   - Search for specific location
   - Use current GPS location
   - Drag marker to exact delivery spot
4. Selected coordinates are used for precise Lalamove quotation
5. Real-time delivery pricing updates based on exact location

## Technical Implementation

### Map Component Location
- `components/InteractiveMap.tsx` - Main interactive map component
- `app/customer-info/page.tsx` - Integration with customer info form

### Key Features
- Google Maps JavaScript API integration
- Places Autocomplete for search
- Geolocation API for current location
- Reverse geocoding for address display
- Real-time coordinate updates

### Dependencies Added
- `@googlemaps/js-api-loader` - Google Maps loader
- `@types/google.maps` - TypeScript definitions

## Testing
1. Add your API key to `.env.local`
2. Run `npm run dev`
3. Navigate to customer info page
4. Test map interactions:
   - Search functionality
   - Current location button
   - Marker dragging
   - Address selection from location picker

## Troubleshooting

### Common Issues
1. **Map not loading**: Check API key and enabled APIs
2. **Search not working**: Ensure Places API is enabled
3. **Current location not working**: Check browser permissions
4. **Quotation errors**: Verify coordinates are being passed correctly

### Browser Permissions
The "Use My Location" feature requires:
- HTTPS connection (or localhost for development)
- User permission for location access
- Geolocation API support

## Cost Considerations
Google Maps APIs have usage-based pricing:
- Maps JavaScript API: $7 per 1,000 loads
- Places API: $17 per 1,000 requests
- Geocoding API: $5 per 1,000 requests

Consider implementing:
- API key restrictions
- Usage monitoring
- Caching for frequently accessed locations 