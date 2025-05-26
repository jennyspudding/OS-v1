import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  try {
    console.log('=== TESTING SUPABASE CONNECTION ===')
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
    
    console.log('Connection test:', { connectionTest, connectionError })
    
    if (connectionError) {
      console.error('Connection failed:', connectionError)
      return false
    }
    
    // Test 2: Check if function exists
    const { data: functionTest, error: functionError } = await supabase.rpc('insert_complete_order', {
      order_data: { test: true }
    })
    
    console.log('Function test:', { functionTest, functionError })
    
    // Test 3: Check environment variables
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    return true
  } catch (error) {
    console.error('Supabase test failed:', error)
    return false
  }
}

// Simple order data validator
export const validateOrderData = (orderData: any) => {
  const required = [
    'order_id',
    'formData.name',
    'formData.phone',
    'formData.recipientName',
    'formData.recipientPhone',
    'alamatLengkap',
    'cart.items',
    'cartTotal',
    'grandTotal'
  ]
  
  const missing = []
  
  for (const field of required) {
    const keys = field.split('.')
    let current = orderData
    
    for (const key of keys) {
      if (!current || current[key] === undefined || current[key] === null) {
        missing.push(field)
        break
      }
      current = current[key]
    }
  }
  
  if (missing.length > 0) {
    console.error('Missing required fields:', missing)
    return false
  }
  
  // Check cart items structure
  if (!Array.isArray(orderData.cart?.items) || orderData.cart.items.length === 0) {
    console.error('Invalid cart items structure')
    return false
  }
  
  return true
} 