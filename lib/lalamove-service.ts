import crypto from 'crypto';

// Lalamove API Configuration
const LALAMOVE_CONFIG = {
  // Use sandbox for development, production for live
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://rest.lalamove.com/v3' 
    : 'https://rest.sandbox.lalamove.com/v3',
  apiKey: process.env.LALAMOVE_API_KEY || '',
  apiSecret: process.env.LALAMOVE_API_SECRET || '',
  market: 'ID JKT', // Jakarta, Indonesia market code
  country: 'ID', // Indonesia country code
  region: 'ID JKT', // Jakarta region code
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
  serviceType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'TRUCK';
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

// Generate signature for Lalamove API authentication
function generateSignature(
  method: string,
  path: string,
  timestamp: number,
  body: string = ''
): string {
  const rawSignature = `${method}\n${path}\n\n${timestamp}\n${body}`;
  return crypto
    .createHmac('sha256', LALAMOVE_CONFIG.apiSecret)
    .update(rawSignature)
    .digest('hex');
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

// Get quotation from Lalamove API
export async function getLalamoveQuotation(
  request: LalamoveQuotationRequest
): Promise<LalamoveQuotationResponse | null> {
  try {
    // Validate coordinates before making API call
    for (const stop of request.stops) {
      const lat = parseFloat(stop.coordinates.lat);
      const lng = parseFloat(stop.coordinates.lng);
      
      if (!validateIndonesianCoordinates(lat, lng)) {
        throw new Error(`Invalid coordinates for Indonesia: ${lat}, ${lng}. Coordinates must be within Indonesia bounds.`);
      }
    }

    const timestamp = Date.now();
    const path = '/quotations';
    const method = 'POST';
    const body = JSON.stringify({ data: request });
    
    const signature = generateSignature(method, path, timestamp, body);
    
    console.log('Making Lalamove API request:', {
      url: `${LALAMOVE_CONFIG.baseUrl}${path}`,
      market: LALAMOVE_CONFIG.market,
      country: LALAMOVE_CONFIG.country,
      region: LALAMOVE_CONFIG.region,
      requestBody: request,
      stops: request.stops.map(stop => ({
        coordinates: stop.coordinates,
        address: stop.address,
      }))
    });
    
    console.log('=== EXACT JSON BEING SENT TO LALAMOVE ===');
    console.log(body);
    console.log('=== END JSON ===');
    
    const response = await fetch(`${LALAMOVE_CONFIG.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${LALAMOVE_CONFIG.apiKey}:${timestamp}:${signature}`,
        'Accept': 'application/json',
        'X-LLM-Country': LALAMOVE_CONFIG.country,
        'X-LLM-Market': LALAMOVE_CONFIG.market,
      },
      body: body,
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
      console.error('Lalamove API error:', errorData);
      throw new Error(`Lalamove API error: ${JSON.stringify(errorData)}`);
    }

    const data = JSON.parse(responseText);
    return data.data;
  } catch (error) {
    console.error('Lalamove quotation error:', error);
    throw error; // Re-throw to handle in calling function
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
  serviceType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'TRUCK' = 'MOTORCYCLE',
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
  return `Rp${total.toLocaleString('id-ID')}`;
}

// Get estimated delivery time (this would need to be enhanced with real data)
export function getEstimatedDeliveryTime(serviceType: string): string {
  switch (serviceType) {
    case 'MOTORCYCLE':
      return '30-45 menit';
    case 'CAR':
      return '45-60 menit';
    case 'VAN':
      return '60-90 menit';
    default:
      return '30-60 menit';
  }
} 