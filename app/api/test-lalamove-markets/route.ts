import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Lalamove API Configuration
const LALAMOVE_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://rest.lalamove.com/v3' 
    : 'https://rest.sandbox.lalamove.com/v3',
  apiKey: process.env.LALAMOVE_API_KEY || '',
  apiSecret: process.env.LALAMOVE_API_SECRET || '',
};

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

export async function GET(request: NextRequest) {
  try {
    const apiKey = LALAMOVE_CONFIG.apiKey;
    const apiSecret = LALAMOVE_CONFIG.apiSecret;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Lalamove API credentials not configured',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          nodeEnv: process.env.NODE_ENV,
          baseUrl: LALAMOVE_CONFIG.baseUrl
        }
      });
    }

    const timestamp = Date.now();
    const path = '/cities';
    const method = 'GET';
    const body = '';
    
    const signature = generateSignature(method, path, timestamp, body);
    
    console.log('Fetching Lalamove cities/markets:', {
      url: `${LALAMOVE_CONFIG.baseUrl}${path}`,
      method,
      timestamp,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret
    });
    
    const response = await fetch(`${LALAMOVE_CONFIG.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('Lalamove cities API response status:', response.status);
    console.log('Lalamove cities API response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch cities from Lalamove API',
        details: {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText: responseText.substring(0, 500) // Limit response text
        }
      });
    }

    const data = JSON.parse(responseText);
    
    // Filter for Indonesia markets
    const indonesiaMarkets = data.data ? data.data.filter((city: any) => 
      city.locode && (
        city.locode.startsWith('ID') || 
        city.name?.toLowerCase().includes('jakarta') ||
        city.name?.toLowerCase().includes('indonesia') ||
        city.country?.toLowerCase().includes('indonesia')
      )
    ) : [];

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched Lalamove cities/markets',
      data: {
        totalCities: data.data ? data.data.length : 0,
        indonesiaMarkets: indonesiaMarkets,
        indonesiaMarketsCount: indonesiaMarkets.length,
        allCities: data.data ? data.data.slice(0, 10) : [], // Show first 10 for reference
        fullResponse: data
      }
    });

  } catch (error) {
    console.error('Test markets error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
} 