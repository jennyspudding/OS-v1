import { NextRequest, NextResponse } from 'next/server';
import { 
  geocodeAddress, 
  getLalamoveQuotation, 
  createDeliveryQuotationRequest,
  LalamoveCoordinate,
  validateIndonesianCoordinates
} from '@/lib/lalamove-service';

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Apply hidden markup to delivery prices
// Motor delivery: +Rp 3,000, Car delivery: +Rp 5,000
function applyDeliveryMarkup(originalPrice: number, serviceType: string): number {
  let markup = 0;
  
  if (serviceType === 'MOTORCYCLE') {
    markup = 3000; // Rp 3,000 for motor delivery
  } else if (serviceType === 'CAR' || serviceType === 'SEDAN') {
    markup = 5000; // Rp 5,000 for car delivery
  }
  
  const finalPrice = originalPrice + markup;
  
  console.log('Hidden markup applied:', {
    serviceType,
    originalPrice,
    markup,
    finalPrice,
    markupPercentage: markup > 0 ? ((markup / originalPrice) * 100).toFixed(2) + '%' : '0%'
  });
  
  return finalPrice;
}

// Apply toll road charges (visible in price breakdown)
function applyTollRoadCharges(basePrice: number, serviceType: string, useTollRoad: boolean): { finalPrice: number, tollCharge: number } {
  let tollCharge = 0;
  
  // Toll road option only available for CAR/SEDAN deliveries
  if (useTollRoad && (serviceType === 'CAR' || serviceType === 'SEDAN')) {
    tollCharge = 25000; // Rp 25,000 for toll road usage
  }
  
  const finalPrice = basePrice + tollCharge;
  
  if (tollCharge > 0) {
    console.log('Toll road charges applied:', {
      serviceType,
      basePrice,
      tollCharge,
      finalPrice,
      useTollRoad
    });
  }
  
  return { finalPrice, tollCharge };
}

// Calculate delivery price based on distance using new formula
function calculateDeliveryPrice(distanceKm: number, serviceType: string): number {
  let finalPrice: number;
  
  if (serviceType === 'MOTORCYCLE') {
    // Motorcycle: if d ≤ 4: fare = 9,200, else: fare = 9,200 + 2,300 * (d - 4)
    if (distanceKm <= 4) {
      finalPrice = 9200;
    } else {
      finalPrice = 9200 + 2300 * (distanceKm - 4);
    }
  } else if (serviceType === 'CAR' || serviceType === 'SEDAN') {
    // City-Car/Sedan: if d ≤ 3: fare = 37,000, else: fare = 37,000 + 2,500 * (d - 3)
    if (distanceKm <= 3) {
      finalPrice = 37000;
    } else {
      finalPrice = 37000 + 2500 * (distanceKm - 3);
    }
  } else {
    // Fallback for other vehicle types (VAN, TRUCK)
    const basePrices = {
      'VAN': 25000,
      'TRUCK': 35000
    };
    const perKmRates = {
      'VAN': 4500,
      'TRUCK': 6000
    };
    const basePrice = basePrices[serviceType as keyof typeof basePrices] || 25000;
    const perKmRate = perKmRates[serviceType as keyof typeof perKmRates] || 4500;
    finalPrice = basePrice + (distanceKm * perKmRate);
  }
  
  // Round to nearest 100 for cleaner pricing
  finalPrice = Math.round(finalPrice / 100) * 100;
  
  console.log('Price calculation (New Formula):', {
    serviceType,
    distanceKm: distanceKm.toFixed(2),
    finalPrice,
    formula: serviceType === 'MOTORCYCLE' 
      ? (distanceKm <= 4 ? '9,200 (base ≤4km)' : `9,200 + 2,300 × (${distanceKm.toFixed(2)} - 4)`)
      : (serviceType === 'CAR' || serviceType === 'SEDAN')
      ? (distanceKm <= 3 ? '37,000 (base ≤3km)' : `37,000 + 2,500 × (${distanceKm.toFixed(2)} - 3)`)
      : 'Legacy formula'
  });
  
  return finalPrice;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deliveryAddress, 
      recipientName, 
      recipientPhone, 
      serviceType = 'MOTORCYCLE',
      coordinates,
      isRequestedAt,
      isExpress,
      orderType,
      useTollRoad
    } = body;

    console.log('Quotation request received:', { 
      deliveryAddress, 
      recipientName, 
      serviceType, 
      coordinates,
      isExpress,
      orderType,
      useTollRoad: useTollRoad ? 'YES' : 'NO',
      fullBody: body 
    });
    console.log('ServiceType received from frontend:', serviceType);
    console.log('ServiceType type:', typeof serviceType);
    console.log('🚗 Toll road option requested:', useTollRoad ? 'YES' : 'NO');
    
    // Determine if this is an express order
    const isExpressOrder = isExpress === true || orderType === 'express';
    console.log('🚀 Express order detected:', isExpressOrder);
    
    // Test pricing calculation for debugging
    if (serviceType) {
      console.log('Testing price calculation for both vehicle types:');
      const testDistance = 5.0; // 5km test distance
      const motorcyclePrice = calculateDeliveryPrice(testDistance, 'MOTORCYCLE');
      const carPrice = calculateDeliveryPrice(testDistance, 'CAR');
      console.log(`Test prices for ${testDistance}km:`, {
        MOTORCYCLE: motorcyclePrice,
        CAR: carPrice,
        difference: carPrice - motorcyclePrice,
        carIsMoreExpensive: carPrice > motorcyclePrice
      });
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Check API credentials
    const apiKey = process.env.LALAMOVE_API_KEY;
    const apiSecret = process.env.LALAMOVE_API_SECRET;
    
    // Store coordinates - Different for Express vs Regular orders
    let storeCoordinates: LalamoveCoordinate;
    let storeAddress: string;
    let storeName: string;
    
    if (isExpressOrder) {
      // Express store coordinates
      storeCoordinates = {
        lat: -6.154887932771065,
        lng: 106.87617965009943
      };
      storeAddress = process.env.EXPRESS_STORE_ADDRESS || "Jenny's Pudding Express Store, Jakarta, Indonesia";
      storeName = "Jenny's Pudding Express";
      console.log('🚀 Using EXPRESS store coordinates:', storeCoordinates);
    } else {
      // Regular store coordinates (main store)
      storeCoordinates = {
        lat: parseFloat(process.env.STORE_PICKUP_LAT || "-6.2088"), // Jakarta Central area
        lng: parseFloat(process.env.STORE_PICKUP_LNG || "106.8456")
      };
      storeAddress = process.env.STORE_PICKUP_ADDRESS || "Jenny's Pudding Store, Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220, Indonesia";
      storeName = process.env.STORE_NAME || "Jenny's Pudding";
      console.log('📦 Using REGULAR store coordinates:', storeCoordinates);
    }
    
    const storePhone = process.env.STORE_PHONE || "+6281234567890";

    console.log('Store coordinates:', storeCoordinates);
    console.log('Store address:', storeAddress);

    // Validate store coordinates
    const storeLat = storeCoordinates.lat;
    const storeLng = storeCoordinates.lng;
    if (!validateIndonesianCoordinates(storeLat, storeLng)) {
      console.error('Invalid store coordinates:', { lat: storeLat, lng: storeLng });
      return NextResponse.json(
        { error: 'Store coordinates are invalid for Indonesia. Please check configuration.' },
        { status: 500 }
      );
    }

    // Use provided coordinates or geocode the delivery address
    let deliveryCoordinates: LalamoveCoordinate;
    
    if (coordinates) {
      // Use precise coordinates from map selection
      console.log('Using provided coordinates:', coordinates);
      
      // Validate delivery coordinates
      if (!validateIndonesianCoordinates(coordinates.lat, coordinates.lng)) {
        console.error('Invalid delivery coordinates:', coordinates);
        return NextResponse.json(
          { error: 'Lokasi pengiriman tidak valid untuk Indonesia. Pastikan lokasi berada di wilayah Indonesia.' },
          { status: 400 }
        );
      }
      
      deliveryCoordinates = {
        lat: coordinates.lat,
        lng: coordinates.lng
      };
    } else {
      // Geocode the delivery address
      console.log('Geocoding address:', deliveryAddress);
      const geocodedCoords = await geocodeAddress(deliveryAddress);
      console.log('Geocoding result:', geocodedCoords);
      
      if (!geocodedCoords) {
        return NextResponse.json(
          { error: 'Could not find coordinates for the delivery address' },
          { status: 400 }
        );
      }
      
      // Validate geocoded coordinates
      const geocodedLat = geocodedCoords.lat;
      const geocodedLng = geocodedCoords.lng;
      if (!validateIndonesianCoordinates(geocodedLat, geocodedLng)) {
        console.error('Geocoded coordinates outside Indonesia:', { lat: geocodedLat, lng: geocodedLng });
        return NextResponse.json(
          { error: 'Alamat yang ditemukan berada di luar wilayah Indonesia.' },
          { status: 400 }
        );
      }
      
      deliveryCoordinates = geocodedCoords;
    }

    // Calculate real distance between store and delivery location
    const deliveryLat = deliveryCoordinates.lat;
    const deliveryLng = deliveryCoordinates.lng;
    const distanceKm = calculateDistance(storeLat, storeLng, deliveryLat, deliveryLng);
    const distanceMeters = Math.round(distanceKm * 1000);
    
    console.log('Distance calculation:', {
      store: { lat: storeLat, lng: storeLng },
      delivery: { lat: deliveryLat, lng: deliveryLng },
      distanceKm: distanceKm.toFixed(2),
      distanceMeters
    });

    if (!apiKey || !apiSecret) {
      console.log('Lalamove API credentials not configured, returning calculated mock quotation');
      
      // Return realistic mock quotation based on actual distance
      const calculatedPrice = calculateDeliveryPrice(distanceKm, serviceType);
      const markedUpPrice = applyDeliveryMarkup(calculatedPrice, serviceType);
      const { finalPrice, tollCharge } = applyTollRoadCharges(markedUpPrice, serviceType, useTollRoad);
      const mockQuotation = {
        quotationId: 'mock-' + Date.now(),
        priceBreakdown: {
          total: finalPrice.toString(),
          currency: 'IDR'
        },
        distance: {
          value: distanceMeters.toString(),
          text: `${distanceKm.toFixed(1)} km`
        },
        serviceType: serviceType,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      };

      return NextResponse.json({
        success: true,
        quotation: {
          id: mockQuotation.quotationId,
          price: mockQuotation.priceBreakdown,
          distance: mockQuotation.distance,
          serviceType: mockQuotation.serviceType,
          expiresAt: mockQuotation.expiresAt,
          estimatedTime: getEstimatedDeliveryTime(mockQuotation.serviceType),
          tollCharge: tollCharge > 0 ? {
            value: tollCharge.toString(),
            currency: 'IDR'
          } : undefined,
          hasTollRoad: tollCharge > 0
        },
        isMock: true,
        note: `Calculated based on ${distanceKm.toFixed(1)}km distance from store`
      });
    }

    // Create quotation request with store details
    const quotationRequest = createDeliveryQuotationRequest(
      storeCoordinates,
      storeAddress,
      deliveryCoordinates,
      deliveryAddress,
      recipientName,
      recipientPhone,
      serviceType,
      storeName,
      storePhone,
      isRequestedAt
    );

    console.log('Lalamove quotation request:', JSON.stringify(quotationRequest, null, 2));

    // Get quotation from Lalamove
    let quotation;
    try {
      quotation = await getLalamoveQuotation(quotationRequest);
    } catch (lalamoveError: any) {
      console.error('Lalamove API error:', lalamoveError);
      
      // Check if it's a coordinate validation error
      if (lalamoveError.message && lalamoveError.message.includes('Invalid coordinates for Indonesia')) {
        return NextResponse.json(
          { error: 'Koordinat lokasi tidak valid untuk Indonesia. Silakan pilih lokasi yang berada di wilayah Indonesia.' },
          { status: 400 }
        );
      }
      
      // Check if it's a market error or any Lalamove API error
      if (lalamoveError.message && (
        lalamoveError.message.includes('ERR_INVALID_MARKET') ||
        lalamoveError.message.includes('Invalid market') ||
        lalamoveError.message.includes('market') ||
        lalamoveError.message.includes('Lalamove API error')
      )) {
        console.log('Lalamove API/market error, returning calculated mock quotation');
        const calculatedPrice = calculateDeliveryPrice(distanceKm, serviceType);
        const markedUpPrice = applyDeliveryMarkup(calculatedPrice, serviceType);
        const { finalPrice, tollCharge } = applyTollRoadCharges(markedUpPrice, serviceType, useTollRoad);
        const mockQuotation = {
          quotationId: 'fallback-market-' + Date.now(),
          priceBreakdown: {
            total: finalPrice.toString(),
            currency: 'IDR'
          },
          distance: {
            value: distanceMeters.toString(),
            text: `${distanceKm.toFixed(1)} km`
          },
          serviceType: serviceType,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };

        return NextResponse.json({
          success: true,
          quotation: {
            id: mockQuotation.quotationId,
            price: mockQuotation.priceBreakdown,
            distance: mockQuotation.distance,
            serviceType: mockQuotation.serviceType,
            expiresAt: mockQuotation.expiresAt,
            estimatedTime: getEstimatedDeliveryTime(mockQuotation.serviceType),
            tollCharge: tollCharge > 0 ? {
              value: tollCharge.toString(),
              currency: 'IDR'
            } : undefined,
            hasTollRoad: tollCharge > 0
          },
          isMock: true,
          note: `Lalamove service unavailable. Calculated based on ${distanceKm.toFixed(1)}km distance with ${serviceType.toLowerCase()}`
        });
      }
      
      // Return calculated mock quotation for other API failures
      const calculatedPrice = calculateDeliveryPrice(distanceKm, serviceType);
      const markedUpPrice = applyDeliveryMarkup(calculatedPrice, serviceType);
      const { finalPrice, tollCharge } = applyTollRoadCharges(markedUpPrice, serviceType, useTollRoad);
      const mockQuotation = {
        quotationId: 'fallback-' + Date.now(),
        priceBreakdown: {
          total: finalPrice.toString(),
          currency: 'IDR'
        },
        distance: {
          value: distanceMeters.toString(),
          text: `${distanceKm.toFixed(1)} km`
        },
        serviceType: serviceType,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      return NextResponse.json({
        success: true,
        quotation: {
          id: mockQuotation.quotationId,
          price: mockQuotation.priceBreakdown,
          distance: mockQuotation.distance,
          serviceType: mockQuotation.serviceType,
          expiresAt: mockQuotation.expiresAt,
          estimatedTime: getEstimatedDeliveryTime(mockQuotation.serviceType),
          tollCharge: tollCharge > 0 ? {
            value: tollCharge.toString(),
            currency: 'IDR'
          } : undefined,
          hasTollRoad: tollCharge > 0
        },
        isMock: true,
        note: `API unavailable. Calculated based on ${distanceKm.toFixed(1)}km distance from store`
      });
    }

    if (!quotation) {
      return NextResponse.json(
        { error: 'Failed to get delivery quotation' },
        { status: 500 }
      );
    }

    // Apply hidden markup to delivery prices
    const originalPrice = parseInt(quotation.priceBreakdown.total);
    const markedUpPrice = applyDeliveryMarkup(originalPrice, serviceType);

    // Apply toll road charges (visible in price breakdown)
    const { finalPrice, tollCharge } = applyTollRoadCharges(markedUpPrice, serviceType, useTollRoad);

    // Build response object
    const responseQuotation: any = {
      id: quotation.quotationId,
      price: {
        total: finalPrice.toString(),
        currency: 'IDR'
      },
      distance: quotation.distance,
      serviceType: quotation.serviceType,
      expiresAt: quotation.expiresAt,
      estimatedTime: getEstimatedDeliveryTime(quotation.serviceType)
    };

    // Only include toll charge in response if it was actually applied
    if (tollCharge > 0) {
      responseQuotation.tollCharge = {
        value: tollCharge.toString(),
        currency: 'IDR'
      };
      responseQuotation.hasTollRoad = true;
    } else {
      responseQuotation.hasTollRoad = false;
    }

    // Return the quotation data
    return NextResponse.json({
      success: true,
      quotation: responseQuotation
    });

  } catch (error) {
    console.error('Quotation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getEstimatedDeliveryTime(serviceType: string): string {
  switch (serviceType) {
    case 'MOTORCYCLE':
      return '30-45 menit';
    case 'SEDAN':
    case 'CAR':
      return '45-60 menit';
    case 'VAN':
      return '60-90 menit';
    case 'TRUCK':
      return '90-120 menit';
    default:
      return '30-60 menit';
  }
} 