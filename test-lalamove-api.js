const crypto = require('crypto');

// Test the new Lalamove API implementation
const apiKey = 'pk_prod_73db2a37a226646a93bc5b22d2a5a3f8';
const secret = 'sk_prod_LL3V+vIfMJeEtyWI7Ahv0q0GFQRgjUmXPRtNXHBK7FMer27BcX3DsgulEYZGbFJq';

// Test with MOTORCYCLE service type
async function testMotorcycleQuotation() {
  const method = 'POST';
  const path = '/v3/quotations';
  const timestamp = Date.now().toString(); // MILLISECOND

  const payloadData = {
    scheduleAt: "2025-05-28T08:56:19.007Z",
    serviceType: "MOTORCYCLE",
    specialRequests: [],
    language: "id_ID",
    stops: [
      {
        coordinates: {
          lat: "-6.217825", // <-- string
          lng: "106.818685" // <-- string
        },
        address: "Menara Standard Chartered, Jl. Prof. DR. Satrio No.164, RT.3/RW.4, Karet Semanggi, Setia Budi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12940, Indonesia"
      },
      {
        coordinates: {
          lat: "-6.127968", // <-- string
          lng: "106.650878" // <-- string
        },
        address: "Tangerang City, Banten 19120, Indonesia"
      }
    ],
    isRouteOptimized: true
  };

  const body = JSON.stringify({ data: payloadData });
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const signature = crypto.createHmac('sha256', secret).update(rawSignature).digest('hex');
  const token = `${apiKey}:${timestamp}:${signature}`;

  console.log('=== MOTORCYCLE TEST ===');
  console.log('Authorization:', `hmac ${token}`);
  console.log('Market:', 'ID');
  console.log('Request-ID:', 'test-motorcycle-123');
  console.log('BODY:', body);

  try {
    const response = await fetch('https://rest.lalamove.com/v3/quotations', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `hmac ${token}`,
        'Market': 'ID',
        'Request-ID': 'test-motorcycle-123'
      },
      body: body
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ MOTORCYCLE quotation successful');
      console.log('Quotation ID:', data.data?.quotationId);
      console.log('Price:', data.data?.priceBreakdown?.total, data.data?.priceBreakdown?.currency);
    } else {
      console.log('❌ MOTORCYCLE quotation failed');
    }
  } catch (error) {
    console.error('❌ MOTORCYCLE test error:', error.message);
  }
}

// Test with SEDAN service type (for CAR)
async function testSedanQuotation() {
  const method = 'POST';
  const path = '/v3/quotations';
  const timestamp = Date.now().toString(); // MILLISECOND

  const payloadData = {
    scheduleAt: "2025-05-28T08:56:19.007Z",
    serviceType: "SEDAN",
    specialRequests: [],
    language: "id_ID",
    stops: [
      {
        coordinates: {
          lat: "-6.217825", // <-- string
          lng: "106.818685" // <-- string
        },
        address: "Menara Standard Chartered, Jl. Prof. DR. Satrio No.164, RT.3/RW.4, Karet Semanggi, Setia Budi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12940, Indonesia"
      },
      {
        coordinates: {
          lat: "-6.127968", // <-- string
          lng: "106.650878" // <-- string
        },
        address: "Tangerang City, Banten 19120, Indonesia"
      }
    ],
    isRouteOptimized: true
  };

  const body = JSON.stringify({ data: payloadData });
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const signature = crypto.createHmac('sha256', secret).update(rawSignature).digest('hex');
  const token = `${apiKey}:${timestamp}:${signature}`;

  console.log('\n=== SEDAN TEST ===');
  console.log('Authorization:', `hmac ${token}`);
  console.log('Market:', 'ID');
  console.log('Request-ID:', 'test-sedan-123');
  console.log('BODY:', body);

  try {
    const response = await fetch('https://rest.lalamove.com/v3/quotations', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `hmac ${token}`,
        'Market': 'ID',
        'Request-ID': 'test-sedan-123'
      },
      body: body
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SEDAN quotation successful');
      console.log('Quotation ID:', data.data?.quotationId);
      console.log('Price:', data.data?.priceBreakdown?.total, data.data?.priceBreakdown?.currency);
    } else {
      console.log('❌ SEDAN quotation failed');
    }
  } catch (error) {
    console.error('❌ SEDAN test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Lalamove API Implementation\n');
  
  await testMotorcycleQuotation();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  await testSedanQuotation();
  
  console.log('\n✅ Tests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testMotorcycleQuotation,
  testSedanQuotation,
  runTests
}; 