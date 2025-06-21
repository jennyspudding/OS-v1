import { NextRequest, NextResponse } from 'next/server';
import { telegramNotifier, type OrderData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();
    
    console.log('📱 API: Received order data for Telegram notification:', {
      orderId: orderData.orderId,
      orderType: orderData.orderType,
      customerName: orderData.customerName
    });
    
    // Validate required fields
    if (!orderData.orderId || !orderData.customerName) {
      return NextResponse.json({
        success: false,
        message: 'Missing required order data'
      }, { status: 400 });
    }
    
    // Send notification
    const success = await telegramNotifier.sendOrderNotification(orderData);
    
    if (success) {
      console.log('✅ API: Telegram notification sent successfully for order:', orderData.orderId);
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } else {
      console.error('❌ API: Failed to send Telegram notification for order:', orderData.orderId);
      return NextResponse.json({
        success: false,
        message: 'Failed to send notification'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API: Error in Telegram notification endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 