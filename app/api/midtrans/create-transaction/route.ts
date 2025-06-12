import { NextRequest, NextResponse } from 'next/server';

const midtransClient = require('midtrans-client');

// Create Snap API instance
const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: 'SB-Mid-server-15M_QkwZUuSpmeaBpypBxTHI'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parameter = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: body.gross_amount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: body.customer_details.first_name,
        last_name: body.customer_details.last_name,
        email: body.customer_details.email,
        phone: body.customer_details.phone
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
    
  } catch (error) {
    console.error('Midtrans error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 