import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const apiKey = process.env.LALAMOVE_API_KEY;
    const apiSecret = process.env.LALAMOVE_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Lalamove API credentials not configured',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    // Test geocoding with a simple Jakarta address
    const testAddress = "Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta";
    const encodedAddress = encodeURIComponent(testAddress);
    
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=id&limit=1`
    );
    
    const geocodeData = await geocodeResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Lalamove integration test successful',
      config: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        nodeEnv: process.env.NODE_ENV,
        baseUrl: process.env.NODE_ENV === 'production' 
          ? 'https://rest.lalamove.com/v3' 
          : 'https://rest.sandbox.lalamove.com/v3'
      },
      geocodeTest: {
        address: testAddress,
        found: geocodeData.length > 0,
        coordinates: geocodeData.length > 0 ? {
          lat: geocodeData[0].lat,
          lng: geocodeData[0].lon
        } : null
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 