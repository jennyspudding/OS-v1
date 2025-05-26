-- RPC function to update order status (bypasses RLS issues)
CREATE OR REPLACE FUNCTION update_order_status_direct(
  order_uuid UUID,
  new_status order_status,
  proof_url TEXT DEFAULT NULL,
  payment_method_val payment_method DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER -- This allows the function to bypass RLS
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders 
  SET 
    status = new_status,
    payment_proof_url = COALESCE(proof_url, payment_proof_url),
    payment_method = COALESCE(payment_method_val, payment_method),
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permission to public (or specific roles)
GRANT EXECUTE ON FUNCTION update_order_status_direct TO public; 