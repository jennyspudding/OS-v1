import { NextRequest, NextResponse } from 'next/server';
import { handleLalamoveWebhook, verifyWebhookSignature, LalamoveWebhookPayload } from '@/lib/lalamove-webhook-handler';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Lalamove webhook received');
    
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-lalamove-signature') || '';
    
    // Verify webhook signature (optional but recommended for security)
    const webhookSecret = process.env.LALAMOVE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Parse the webhook payload
    const payload: LalamoveWebhookPayload = JSON.parse(body);
    
    console.log('📦 Webhook payload:', {
      type: payload.type,
      orderId: payload.orderId,
      status: payload.status
    });
    
    // Handle the webhook
    const result = await handleLalamoveWebhook(payload);
    
    if (result.success) {
      console.log('✅ Webhook processed successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        orderId: payload.orderId 
      });
    } else {
      console.error('❌ Webhook processing failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'Lalamove webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 