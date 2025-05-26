import { NextRequest, NextResponse } from 'next/server';

// Calculate delivery price based on distance
function calculateDeliveryPrice(distanceKm: number, serviceType: string): number {
  const basePrices = {
    'MOTORCYCLE': 8000,  // Base price for motorcycle
    'CAR': 15000,        // Base price for car (almost 2x motorcycle)
    'VAN': 25000,        // Base price for van
    'TRUCK': 35000       // Base price for truck
  };
  
  const perKmRates = {
    'MOTORCYCLE': 2000,  // Price per km for motorcycle
    'CAR': 3500,         // Price per km for car (higher than motorcycle)
    'VAN': 4500,         // Price per km for van
    'TRUCK': 6000        // Price per km for truck
  };
  
  const basePrice = basePrices[serviceType as keyof typeof basePrices] || basePrices.MOTORCYCLE;
  const perKmRate = perKmRates[serviceType as keyof typeof perKmRates] || perKmRates.MOTORCYCLE;
  
  // Calculate total: base price + (distance * rate per km)
  const totalPrice = basePrice + (distanceKm * perKmRate);
  
  // Round to nearest 500
  const finalPrice = Math.round(totalPrice / 500) * 500;
  
  return finalPrice;
}

export async function GET(request: NextRequest) {
  const testDistances = [1, 3, 5, 10, 15];
  const vehicleTypes = ['MOTORCYCLE', 'CAR'];
  
  const results = [];
  
  for (const distance of testDistances) {
    const motorcyclePrice = calculateDeliveryPrice(distance, 'MOTORCYCLE');
    const carPrice = calculateDeliveryPrice(distance, 'CAR');
    
    results.push({
      distance: `${distance}km`,
      motorcycle: {
        price: motorcyclePrice,
        formatted: `Rp${motorcyclePrice.toLocaleString('id-ID')}`
      },
      car: {
        price: carPrice,
        formatted: `Rp${carPrice.toLocaleString('id-ID')}`
      },
      difference: {
        amount: carPrice - motorcyclePrice,
        formatted: `Rp${(carPrice - motorcyclePrice).toLocaleString('id-ID')}`
      },
      carIsMoreExpensive: carPrice > motorcyclePrice
    });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Pricing calculation test',
    results,
    summary: {
      allTestsPassed: results.every(r => r.carIsMoreExpensive),
      note: 'Car should always be more expensive than motorcycle'
    }
  });
} 