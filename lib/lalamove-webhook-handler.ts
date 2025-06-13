// Lalamove Webhook Handler for Real-time Status Updates
import { supabase } from './supabase';

export interface LalamoveWebhookPayload {
  type: 'ORDER_STATUS_CHANGED' | 'DRIVER_ASSIGNED' | 'ORDER_AMOUNT_CHANGED' | 'ORDER_REPLACED' | 'ORDER_EDITED';
  orderId: string;
  status?: string;
  driverDetails?: {
    driverId: string;
    name: string;
    phone: string;
    plateNumber: string;
    photo?: string;
  };
  timestamp: string;
  metadata?: any;
}

// Map Lalamove statuses to internal delivery statuses
const mapLalamoveStatusToInternal = (lalamoveStatus: string): string => {
  switch (lalamoveStatus) {
    case 'ASSIGNING_DRIVER':
      return 'pickup_requested';
    case 'ON_GOING':
      return 'picked_up';
    case 'PICKED_UP':
      return 'picked_up';
    case 'COMPLETED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'pickup_requested';
  }
};

// Handle incoming webhook from Lalamove
export async function handleLalamoveWebhook(payload: LalamoveWebhookPayload) {
  try {
    console.log('🔔 Received Lalamove webhook:', payload);

    const { orderId, type, status, driverDetails, timestamp } = payload;

    // Find the order in our database using Lalamove order ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('lalamove_order_id', orderId)
      .single();

    if (findError || !order) {
      console.error('❌ Order not found for Lalamove ID:', orderId);
      return { success: false, error: 'Order not found' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle different webhook types
    switch (type) {
      case 'ORDER_STATUS_CHANGED':
        if (status) {
          updateData.lalamove_order_status = status;
          updateData.delivery_status = mapLalamoveStatusToInternal(status);
          
          // Add status update to internal notes
          const timestampWIB = new Date(timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
          updateData.internal_notes = (order.internal_notes || '') + 
            `\n\n=== WEBHOOK STATUS UPDATE (${timestampWIB} WIB) ===\n` +
            `Lalamove Status: ${status}\n` +
            `Internal Status: ${updateData.delivery_status}`;
        }
        break;

      case 'DRIVER_ASSIGNED':
        if (driverDetails) {
          updateData.delivery_status = 'driver_assigned';
          
          // Add driver details to internal notes
          const timestampWIB = new Date(timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
          updateData.internal_notes = (order.internal_notes || '') + 
            `\n\n=== DRIVER ASSIGNED (${timestampWIB} WIB) ===\n` +
            `Driver: ${driverDetails.name}\n` +
            `Phone: ${driverDetails.phone}\n` +
            `Vehicle: ${driverDetails.plateNumber}\n` +
            `Driver ID: ${driverDetails.driverId}`;
        }
        break;

      case 'ORDER_AMOUNT_CHANGED':
        // Log amount changes
        const timestampWIB = new Date(timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        updateData.internal_notes = (order.internal_notes || '') + 
          `\n\n=== ORDER AMOUNT CHANGED (${timestampWIB} WIB) ===\n` +
          `Webhook received for order amount change`;
        break;

      default:
        console.log('ℹ️ Unhandled webhook type:', type);
    }

    // Update the order in database
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('lalamove_order_id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Order updated successfully:', updatedOrder.order_id);
    return { success: true, order: updatedOrder };

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Verify webhook signature (for security)
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
} 