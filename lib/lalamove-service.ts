import crypto from 'crypto';

// Lalamove API Configuration
const LALAMOVE_CONFIG = {
  apiKey: process.env.LALAMOVE_API_KEY || 'pk_prod_73db2a37a226646a93bc5b22d2a5a3f8',
  apiSecret: process.env.LALAMOVE_API_SECRET || 'sk_prod_LL3V+vIfMJeEtyWI7Ahv0q0GFQRgjUmXPRtNXHBK7FMer27BcX3DsgulEYZGbFJq',
  baseUrl: 'https://rest.lalamove.com',
  market: 'ID', // Indonesia market code
};

// Indonesia coordinate bounds for validation
const INDONESIA_BOUNDS = {
  north: 6.0,    // Northern tip of Sumatra
  south: -11.0,  // Southern tip of Java
  east: 141.0,   // Eastern tip of Papua
  west: 95.0     // Western tip of Sumatra
};

// Types based on Lalamove API documentation - Updated format
export interface LalamoveCoordinate {
  lat: number;
  lng: number;
}

export interface LalamoveStop {
  coordinates: {
    lat: string;
    lng: string;
  };
  address: string;
}

export interface LalamoveRequesterContact {
  displayName: string;
  phone: string;
}

export interface LalamoveItem {
  quantity: string;
  weight: 'LESS_THAN_3KG' | 'BETWEEN_3KG_AND_10KG' | 'BETWEEN_10KG_AND_20KG' | 'MORE_THAN_20KG';
  categories: string[];
  handlingInstructions: string[];
}

export interface LalamoveQuotationRequest {
  scheduleAt?: string;
  serviceType: 'MOTORCYCLE' | 'SEDAN' | 'CAR' | 'VAN' | 'TRUCK';
  specialRequests?: string[];
  language?: string;
  stops: LalamoveStop[];
  isRouteOptimized?: boolean;
}

export interface LalamovePriceBreakdown {
  base: string;
  extraMileage?: string;
  surcharge?: string;
  totalBeforeOptimization: string;
  totalExcludePriorityFee: string;
  total: string;
  currency: string;
}

export interface LalamoveQuotationResponse {
  quotationId: string;
  scheduleAt?: string;
  serviceType: string;
  specialRequests: string[];
  expiresAt: string;
  priceBreakdown: LalamovePriceBreakdown;
  distance: {
    value: string;
    unit: string;
  };
  stops: LalamoveStop[];
  item?: any;
}

// Generate HMAC signature for Lalamove API authentication
function generateSignature(
  method: string,
  path: string,
  timestamp: string,
  body: string,
  secret: string
): string {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  return crypto.createHmac('sha256', secret).update(rawSignature).digest('hex');
}

// Geocode address to coordinates using a geocoding service
export async function geocodeAddress(address: string): Promise<LalamoveCoordinate | null> {
  try {
    // Using OpenStreetMap Nominatim for free geocoding
    // In production, consider using Google Maps Geocoding API for better accuracy
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=id&limit=1`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Validate if coordinates are within Indonesia
export function validateIndonesianCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= INDONESIA_BOUNDS.south &&
    lat <= INDONESIA_BOUNDS.north &&
    lng >= INDONESIA_BOUNDS.west &&
    lng <= INDONESIA_BOUNDS.east
  );
}

// Get quotation from Lalamove API using direct API calls
export async function getLalamoveQuotation(
  request: LalamoveQuotationRequest
): Promise<LalamoveQuotationResponse | null> {
  try {
    // Check if we should use mock service
    if (!LALAMOVE_CONFIG.apiKey || !LALAMOVE_CONFIG.apiSecret) {
      console.log('🧪 No Lalamove API credentials found, using mock service');
      const { getMockLalamoveQuotation } = await import('./lalamove-mock-service');
      return await getMockLalamoveQuotation(request);
    }

    // Validate coordinates before making API call
    for (const stop of request.stops) {
      const lat = parseFloat(stop.coordinates.lat);
      const lng = parseFloat(stop.coordinates.lng);
      
      if (!validateIndonesianCoordinates(lat, lng)) {
        throw new Error(`Invalid coordinates for Indonesia: ${lat}, ${lng}. Coordinates must be within Indonesia bounds.`);
      }
    }

    // Convert service type for API (MOTORCYCLE -> MOTORCYCLE, CAR -> SEDAN)
    let apiServiceType = request.serviceType;
    if (request.serviceType === 'CAR') {
      apiServiceType = 'SEDAN';
    }

    // Prepare the payload data
    const payloadData = {
      scheduleAt: request.scheduleAt || new Date().toISOString(),
      serviceType: apiServiceType,
      specialRequests: request.specialRequests || [],
      language: request.language || "id_ID",
      stops: request.stops,
      isRouteOptimized: request.isRouteOptimized !== false
    };

    const method = 'POST';
    const path = '/v3/quotations';
    const timestamp = Date.now().toString(); // MILLISECOND
    const body = JSON.stringify({ data: payloadData });
    
    // Generate signature
    const signature = generateSignature(method, path, timestamp, body, LALAMOVE_CONFIG.apiSecret);
    const token = `${LALAMOVE_CONFIG.apiKey}:${timestamp}:${signature}`;

    console.log('Making Lalamove API request:', {
      url: `${LALAMOVE_CONFIG.baseUrl}${path}`,
      method,
      serviceType: apiServiceType,
      stops: request.stops.length,
      market: LALAMOVE_CONFIG.market
    });

    // Make the API request
    const response = await fetch(`${LALAMOVE_CONFIG.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${token}`,
        'Market': LALAMOVE_CONFIG.market,
        'Request-ID': `jenny-pudding-${Date.now()}`
      },
      body: body
    });

    const responseText = await response.text();
    console.log('Lalamove API response status:', response.status);
    console.log('Lalamove API response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      console.error('Lalamove API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Fallback to mock service on API error
      console.log('🧪 Falling back to mock service due to API error');
      const { getMockLalamoveQuotation } = await import('./lalamove-mock-service');
      return await getMockLalamoveQuotation(request);
    }

    const apiResponse = JSON.parse(responseText);
    console.log('Lalamove API success response:', apiResponse);

    // Convert API response to our format
    const quotationData = apiResponse.data || apiResponse;
    const response_formatted: LalamoveQuotationResponse = {
      quotationId: quotationData.quotationId || `api-${Date.now()}`,
      scheduleAt: quotationData.scheduleAt,
      serviceType: request.serviceType, // Use original service type
      specialRequests: quotationData.specialRequests || [],
      expiresAt: quotationData.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      priceBreakdown: {
        base: quotationData.priceBreakdown?.base || '0',
        extraMileage: quotationData.priceBreakdown?.extraMileage || '0',
        surcharge: quotationData.priceBreakdown?.surcharge || '0',
        totalBeforeOptimization: quotationData.priceBreakdown?.totalBeforeOptimization || quotationData.priceBreakdown?.total || '0',
        totalExcludePriorityFee: quotationData.priceBreakdown?.totalExcludePriorityFee || quotationData.priceBreakdown?.total || '0',
        total: quotationData.priceBreakdown?.total || '0',
        currency: quotationData.priceBreakdown?.currency || 'IDR'
      },
      distance: {
        value: quotationData.distance?.value || '0',
        unit: quotationData.distance?.unit || 'km'
      },
      stops: request.stops
    };

    return response_formatted;
  } catch (error) {
    console.error('Lalamove API quotation error:', error);
    
    // Fallback to mock service if real API fails
    console.log('🧪 Falling back to mock service due to API error');
    try {
      const { getMockLalamoveQuotation } = await import('./lalamove-mock-service');
      return await getMockLalamoveQuotation(request);
    } catch (mockError) {
      console.error('Mock service also failed:', mockError);
      throw error; // Throw original error
    }
  }
}

// Helper function to create a delivery quotation request
export function createDeliveryQuotationRequest(
  pickupCoordinates: LalamoveCoordinate,
  pickupAddress: string,
  deliveryCoordinates: LalamoveCoordinate,
  deliveryAddress: string,
  recipientName?: string,
  recipientPhone?: string,
  serviceType: 'MOTORCYCLE' | 'SEDAN' | 'CAR' | 'VAN' | 'TRUCK' = 'MOTORCYCLE',
  storeName?: string,
  storePhone?: string,
  isRequestedAt?: string
): LalamoveQuotationRequest {
  const request: LalamoveQuotationRequest = {
    scheduleAt: isRequestedAt || new Date().toISOString(),
    serviceType,
    specialRequests: [],
    language: "id_ID",
    stops: [
      {
        coordinates: {
          lat: pickupCoordinates.lat.toString(),
          lng: pickupCoordinates.lng.toString()
        },
        address: pickupAddress,
      },
      {
        coordinates: {
          lat: deliveryCoordinates.lat.toString(),
          lng: deliveryCoordinates.lng.toString()
        },
        address: deliveryAddress,
      }
    ],
    isRouteOptimized: true
  };

  return request;
}

// Format price for display
export function formatLalamovePrice(priceBreakdown: LalamovePriceBreakdown): string {
  const total = parseInt(priceBreakdown.total);
  return `IDR ${total.toLocaleString('id-ID')}`;
}

// Get estimated delivery time based on service type
export function getEstimatedDeliveryTime(serviceType: string): string {
  switch (serviceType) {
    case 'MOTORCYCLE':
      return '30-45 minutes';
    case 'SEDAN':
    case 'CAR':
      return '45-60 minutes';
    case 'VAN':
      return '60-90 minutes';
    case 'TRUCK':
      return '90-120 minutes';
    default:
      return '30-60 minutes';
  }
} 