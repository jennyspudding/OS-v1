// Mock Lalamove Service for Testing
// Use this when you don't have real Lalamove API credentials

import { 
  LalamoveQuotationRequest, 
  LalamoveQuotationResponse, 
  LalamovePriceBreakdown 
} from './lalamove-service';

// Mock price calculation based on distance and service type
function calculateMockPrice(
  serviceType: string, 
  distanceKm: number
): LalamovePriceBreakdown {
  let basePrice = 0;
  let perKmRate = 0;
  let freeKm = 0;

  // Mock pricing structure for Indonesia
  switch (serviceType) {
    case 'MOTORCYCLE':
    case 'COURIER':
      basePrice = 9200;  // IDR 9,200 base
      perKmRate = 2300;  // IDR 2,300 per km
      freeKm = 4;        // First 4km included
      break;
    case 'SEDAN':
    case 'CAR':
      basePrice = 37000; // IDR 37,000 base
      perKmRate = 2500;  // IDR 2,500 per km
      freeKm = 3;        // First 3km included
      break;
    case 'VAN':
      basePrice = 55000; // IDR 55,000 base
      perKmRate = 3000;  // IDR 3,000 per km
      freeKm = 3;        // First 3km included
      break;
    case 'TRUCK':
      basePrice = 85000; // IDR 85,000 base
      perKmRate = 4000;  // IDR 4,000 per km
      freeKm = 2;        // First 2km included
      break;
    default:
      basePrice = 9200;
      perKmRate = 2300;
      freeKm = 4;
  }

  // Calculate extra distance charge
  const extraKm = Math.max(0, distanceKm - freeKm);
  const extraCharge = Math.round(extraKm * perKmRate);
  const totalPrice = basePrice + extraCharge;

  return {
    base: basePrice.toString(),
    extraMileage: extraCharge > 0 ? extraCharge.toString() : '0',
    surcharge: '0',
    totalBeforeOptimization: totalPrice.toString(),
    totalExcludePriorityFee: totalPrice.toString(),
    total: totalPrice.toString(),
    currency: 'IDR'
  };
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Mock Lalamove quotation function
export async function getMockLalamoveQuotation(
  request: LalamoveQuotationRequest
): Promise<LalamoveQuotationResponse> {
  
  console.log('🧪 Using MOCK Lalamove service for testing');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Calculate distance between pickup and delivery
  const pickup = request.stops[0];
  const delivery = request.stops[1];
  
  const pickupLat = parseFloat(pickup.coordinates.lat);
  const pickupLng = parseFloat(pickup.coordinates.lng);
  const deliveryLat = parseFloat(delivery.coordinates.lat);
  const deliveryLng = parseFloat(delivery.coordinates.lng);
  
  const distanceKm = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
  
  // Calculate mock pricing
  const priceBreakdown = calculateMockPrice(request.serviceType, distanceKm);
  
  // Generate mock response
  const mockResponse: LalamoveQuotationResponse = {
    quotationId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    scheduleAt: request.scheduleAt,
    serviceType: request.serviceType,
    specialRequests: request.specialRequests || [],
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    priceBreakdown: priceBreakdown,
    distance: {
      value: distanceKm.toFixed(2),
      unit: 'km'
    },
    stops: request.stops
  };

  console.log('🧪 Mock Lalamove response:', {
    quotationId: mockResponse.quotationId,
    serviceType: mockResponse.serviceType,
    distance: `${distanceKm.toFixed(2)} km`,
    totalPrice: `IDR ${parseInt(priceBreakdown.total).toLocaleString('id-ID')}`,
    breakdown: {
      base: `IDR ${parseInt(priceBreakdown.base).toLocaleString('id-ID')}`,
      extraMileage: `IDR ${parseInt(priceBreakdown.extraMileage || '0').toLocaleString('id-ID')}`,
      total: `IDR ${parseInt(priceBreakdown.total).toLocaleString('id-ID')}`
    }
  });

  return mockResponse;
}

// Mock service status
export function isMockServiceEnabled(): boolean {
  return !process.env.LALAMOVE_API_KEY || !process.env.LALAMOVE_API_SECRET;
}

// Get mock service info
export function getMockServiceInfo() {
  return {
    enabled: isMockServiceEnabled(),
    message: isMockServiceEnabled() 
      ? '🧪 Using mock Lalamove service (no real API credentials found)'
      : '✅ Using real Lalamove API service',
    instructions: isMockServiceEnabled()
      ? 'To use real Lalamove API, add LALAMOVE_API_KEY and LALAMOVE_API_SECRET to your .env.local file'
      : 'Real Lalamove API credentials detected'
  };
} 