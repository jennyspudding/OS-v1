import { NextRequest, NextResponse } from 'next/server';
import { telegramNotifier } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Send test message
    const success = await telegramNotifier.sendTestMessage();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test notification. Check your Telegram configuration.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test telegram error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test with sample order data
    const sampleOrder = {
      orderId: 'TEST-' + Date.now(),
      customerName: 'John Doe',
      customerPhone: '+62812345678',
      recipientName: 'Jane Doe',
      recipientPhone: '+62812345679',
      deliveryAddress: 'Jl. Sudirman No. 123, Jakarta Selatan',
      deliveryDateTime: new Date().toISOString(),
      items: [
        {
          name: 'Pudding Coklat',
          quantity: 2,
          price: 25000,
          addOns: [
            { name: 'Extra Vla', price: 5000 },
            { name: 'Topper Lilin', price: 2000 }
          ]
        },
        {
          name: 'Pudding Strawberry',
          quantity: 1,
          price: 25000,
          addOns: []
        }
      ],
      cartTotal: 75000,
      deliveryTotal: 15000,
      discount: 7500,
      promoCode: 'DISCOUNT10',
      grandTotal: 82500,
      orderType: 'normal' as const,
      paymentMethod: 'Bank Transfer BCA'
    };

    const success = await telegramNotifier.sendOrderNotification(sampleOrder);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Sample order notification sent successfully!'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send order notification. Check your Telegram configuration.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test order notification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 