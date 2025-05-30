import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to upload payment proof
export const uploadPaymentProof = async (orderId: string, file: File) => {
  try {
    console.log('=== UPLOAD PAYMENT PROOF DEBUG ===')
    console.log('Order ID:', orderId)
    console.log('File:', file.name, file.size, 'bytes')
    console.log('Supabase configured:', isSupabaseConfigured)
    
    if (!isSupabaseConfigured) {
      console.warn('⚠️ SUPABASE NOT CONFIGURED - Skipping file upload')
      return { data: null, filePath: `mock/${orderId}/${file.name}` }
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${orderId}-${Date.now()}.${fileExt}`
    const filePath = `${orderId}/${fileName}`

    console.log('Generated file path:', filePath)

    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file)

    console.log('Upload response:', { data, error })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('File uploaded successfully to:', filePath)
    return { data, filePath }
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    throw error
  }
}

// Helper function to insert complete order
export const insertCompleteOrder = async (orderData: any) => {
  try {
    console.log('=== INSERTING ORDER DEBUG ===')
    console.log('Order data being sent:', JSON.stringify(orderData, null, 2))
    console.log('Supabase configured:', isSupabaseConfigured)
    
    if (!isSupabaseConfigured) {
      console.warn('⚠️ SUPABASE NOT CONFIGURED - Using mock response')
      console.warn('Please follow SETUP_INSTRUCTIONS.md to configure Supabase')
      
      // Return mock UUID for testing
      return 'mock-uuid-' + Date.now()
    }

    // Generate guest session ID for security
    const guestSessionId = localStorage.getItem('guest_session_id') || 
                          `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_session_id', guestSessionId);

    // Add security fields to order data
    const secureOrderData = {
      ...orderData,
      customer_user_id: null, // Will be set when customer authentication is implemented
      is_guest_order: true,
      guest_session_id: guestSessionId,
      security_flags: {
        client_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        source: 'jennys_pudding_frontend'
      }
    };

    console.log('Secure order data:', JSON.stringify(secureOrderData, null, 2));
    
    const { data, error } = await supabase.rpc('insert_complete_order', {
      order_data: secureOrderData
    })

    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error inserting order:', error)
    throw error
  }
}

// Helper function to update order status by UUID
export const updateOrderStatusByUuid = async (orderUuid: string, status: string, paymentProofUrl: string | null = null) => {
  try {
    console.log('=== UPDATING ORDER STATUS DEBUG ===')
    console.log('Order UUID:', orderUuid)
    console.log('New Status:', status)
    console.log('Payment Proof URL:', paymentProofUrl)
    console.log('Supabase configured:', isSupabaseConfigured)
    
    if (!isSupabaseConfigured) {
      console.warn('⚠️ SUPABASE NOT CONFIGURED - Using mock response')
      return { data: [{ id: orderUuid, status }], error: null }
    }

    // Set guest session context for RLS if available
    const guestSessionId = localStorage.getItem('guest_session_id');
    if (guestSessionId) {
      console.log('Setting guest session context:', guestSessionId);
      
      // Set the guest session for RLS context
      try {
        await supabase.rpc('set_config', {
          setting_name: 'app.guest_session',
          setting_value: guestSessionId,
          is_local: true
        });
      } catch (err: any) {
        console.warn('Could not set guest session context:', err);
      }
    }

    // Use the new secure update function
    const { data, error } = await supabase.rpc('update_order_status_secure', {
      order_uuid: orderUuid,
      new_status: status,
      proof_url: paymentProofUrl,
      payment_method_val: null
    });

    console.log('Update response:', { data, error })

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }

    // Return data in expected format
    return { data: [{ id: orderUuid, status }], error: null };
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Helper function to update order status by order_id (for existing orders)
export const updateOrderStatus = async (orderId: string, status: string, paymentProofUrl: string | null = null) => {
  try {
    console.log('=== UPDATE ORDER STATUS DEBUG ===')
    console.log('Order ID:', orderId)
    console.log('New Status:', status)
    console.log('Payment Proof URL:', paymentProofUrl)
    console.log('Supabase configured:', isSupabaseConfigured)
    
    if (!isSupabaseConfigured) {
      console.warn('⚠️ SUPABASE NOT CONFIGURED - Skipping status update')
      return [{ id: 'mock-id', order_id: orderId, status }]
    }
    
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (paymentProofUrl) {
      updateData.payment_proof_url = paymentProofUrl
      updateData.payment_method = 'bank_transfer'
    }

    console.log('Update data being sent:', updateData)

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId)
      .select()

    console.log('Update response:', { data, error })

    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.warn('No rows were updated. Order ID might not exist:', orderId)
    } else {
      console.log('Successfully updated order:', data[0])
    }

    return data
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
} 