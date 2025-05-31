// Test script to verify delivery markup functionality
// Run this with: node test-delivery-markup.js

console.log('🧪 Testing Delivery Markup & Optional Toll Road Functionality\n');

// Apply hidden markup to delivery prices
// Motor delivery: +Rp 3,000, Car delivery: +Rp 5,000
function applyDeliveryMarkup(originalPrice, serviceType) {
  let markup = 0;
  
  if (serviceType === 'MOTORCYCLE') {
    markup = 3000; // Rp 3,000 for motor delivery
  } else if (serviceType === 'CAR' || serviceType === 'SEDAN') {
    markup = 5000; // Rp 5,000 for car delivery
  }
  
  const finalPrice = originalPrice + markup;
  
  console.log('Hidden markup applied:', {
    serviceType,
    originalPrice: `Rp ${originalPrice.toLocaleString('id-ID')}`,
    markup: `Rp ${markup.toLocaleString('id-ID')}`,
    finalPrice: `Rp ${finalPrice.toLocaleString('id-ID')}`,
    markupPercentage: markup > 0 ? ((markup / originalPrice) * 100).toFixed(2) + '%' : '0%'
  });
  
  return finalPrice;
}

// Apply toll road charges ONLY when customer chooses it (visible in price breakdown)
function applyTollRoadCharges(basePrice, serviceType, useTollRoad) {
  let tollCharge = 0;
  
  // Toll road option only available for CAR/SEDAN deliveries AND only when customer requests it
  if (useTollRoad && (serviceType === 'CAR' || serviceType === 'SEDAN')) {
    tollCharge = 25000; // Rp 25,000 for toll road usage
    console.log('🚗 OPTIONAL toll road charges applied (customer choice):', {
      serviceType,
      basePrice: `Rp ${basePrice.toLocaleString('id-ID')}`,
      tollCharge: `Rp ${tollCharge.toLocaleString('id-ID')}`,
      finalPrice: `Rp ${(basePrice + tollCharge).toLocaleString('id-ID')}`,
      customerChose: 'YES'
    });
  } else if (useTollRoad && serviceType !== 'CAR' && serviceType !== 'SEDAN') {
    console.log('⚠️  Toll road option ignored (not available for ' + serviceType + ')');
  }
  
  const finalPrice = basePrice + tollCharge;
  return { finalPrice, tollCharge };
}

// Test cases
const testCases = [
  { price: 15000, type: 'MOTORCYCLE', useToll: false, description: 'Motorcycle delivery (no toll option)' },
  { price: 25000, type: 'MOTORCYCLE', useToll: true, description: 'Motorcycle delivery (toll requested but ignored)' },
  { price: 45000, type: 'CAR', useToll: false, description: 'Car delivery (customer chose NO toll)' },
  { price: 45000, type: 'CAR', useToll: true, description: 'Car delivery (customer chose YES toll)' },
  { price: 65000, type: 'SEDAN', useToll: true, description: 'Sedan delivery (customer chose YES toll)' },
  { price: 85000, type: 'VAN', useToll: true, description: 'Van delivery (toll requested but ignored)' }
];

console.log('Running test cases:\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  
  // Simulate customer pricing flow (hidden markup + optional toll road)
  const markedUpPrice = applyDeliveryMarkup(testCase.price, testCase.type);
  const { finalPrice, tollCharge } = applyTollRoadCharges(markedUpPrice, testCase.type, testCase.useToll);
  
  console.log(`Final customer price: Rp ${finalPrice.toLocaleString('id-ID')}`);
  console.log(`Toll charge: Rp ${tollCharge.toLocaleString('id-ID')} ${tollCharge > 0 ? '(CUSTOMER SELECTED)' : '(NOT SELECTED)'}`);
  console.log('---');
});

console.log('\n✅ Test completed successfully!');
console.log('\n📋 Summary:');
console.log('- Motorcycle deliveries: +Rp 3,000 markup (hidden)');
console.log('- Car/Sedan deliveries: +Rp 5,000 markup (hidden)');
console.log('- 🚗 Car/Sedan OPTIONAL toll road: +Rp 25,000 (ONLY when customer chooses)');
console.log('- Other vehicle types: No markup, toll option not available');
console.log('- Customer sees final price (with markup + optional toll)');
console.log('- Admin sees original Lalamove price only (no markup, no toll options)'); 