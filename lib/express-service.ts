// Express Store Service
// Service functions for managing Express store functionality with Supabase

import { createClient } from '@supabase/supabase-js';
import { ExpressProduct, ExpressOrder, ExpressStoreConfig } from './types/express';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class ExpressService {
  
  /**
   * Get all available express products (with stock > 0)
   */
  static async getExpressProducts(): Promise<ExpressProduct[]> {
    try {
      const { data, error } = await supabase.rpc('get_express_products');
      
      if (error) {
        console.error('Error fetching express products:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getExpressProducts:', error);
      throw error;
    }
  }

  /**
   * Get all products with express flag info (for admin)
   */
  static async getAllProductsWithExpressInfo() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, is_express_item, express_stock_quantity')
        .order('name');
      
      if (error) {
        console.error('Error fetching products with express info:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllProductsWithExpressInfo:', error);
      throw error;
    }
  }

  /**
   * Update express status and stock for a product (admin only)
   */
  static async updateProductExpressInfo(
    productId: string, 
    isExpressItem: boolean, 
    stockQuantity: number
  ) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          is_express_item: isExpressItem,
          express_stock_quantity: stockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select();
      
      if (error) {
        console.error('Error updating product express info:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Error in updateProductExpressInfo:', error);
      throw error;
    }
  }

  /**
   * Check if enough express stock is available for an order
   */
  static async checkExpressStock(productId: string, quantity: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('express_stock_quantity')
        .eq('id', productId)
        .eq('is_express_item', true)
        .single();
      
      if (error) {
        console.error('Error checking express stock:', error);
        return false;
      }
      
      return (data?.express_stock_quantity || 0) >= quantity;
    } catch (error) {
      console.error('Error in checkExpressStock:', error);
      return false;
    }
  }

  /**
   * Update express stock when order is placed
   */
  static async updateExpressStock(productId: string, quantityOrdered: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_express_stock', {
        product_id: productId,
        quantity_ordered: quantityOrdered
      });
      
      if (error) {
        console.error('Error updating express stock:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('Error in updateExpressStock:', error);
      return false;
    }
  }

  /**
   * Create an express order using the existing insert_complete_order function
   */
  static async createExpressOrder(orderData: {
    order_id: string;
    customer_name: string;
    customer_phone: string;
    recipient_name: string;
    recipient_phone: string;
    full_address: string;
    delivery_lat?: number;
    delivery_lng?: number;
    total_amount: number;
    subtotal: number;
    delivery_cost: number;
    items: any[];
    requested_delivery_time: string;
    vehicle_type?: 'MOTORCYCLE' | 'CAR';
  }) {
    try {
      // Format data for the existing insert_complete_order function
      const formattedOrderData = {
        order_id: orderData.order_id,
        formData: {
          name: orderData.customer_name,
          phone: orderData.customer_phone,
          recipientName: orderData.recipient_name,
          recipientPhone: orderData.recipient_phone,
          province: '',
          city: '',
          district: '',
          postalCode: '',
          street: '',
          detail: ''
        },
        alamatLengkap: orderData.full_address,
        selectedLocation: {
          lat: orderData.delivery_lat || 0,
          lng: orderData.delivery_lng || 0
        },
        vehicleType: orderData.vehicle_type || 'MOTORCYCLE',
        requestedDateTime: orderData.requested_delivery_time,
        cartTotal: orderData.subtotal,
        deliveryTotal: orderData.delivery_cost,
        grandTotal: orderData.total_amount,
        cart: {
          items: orderData.items
        },
        deliveryQuotation: null,
        isMockQuotation: false,
        is_express_order: true // Mark as express order
      };

      // First, insert the order using the existing function
      const { data: orderId, error: orderError } = await supabase.rpc('insert_complete_order', {
        order_data: formattedOrderData
      });
      
      if (orderError) {
        console.error('Error creating express order:', orderError);
        throw orderError;
      }

      // Then, update the order to mark it as express
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ is_express_order: true })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error('Error marking order as express:', updateError);
        throw updateError;
      }
      
      // Update stock for each express item in the order
      for (const item of orderData.items) {
        if (item.is_express_item) {
          await this.updateExpressStock(item.id, item.quantity);
        }
      }
      
      return updatedOrder;
    } catch (error) {
      console.error('Error in createExpressOrder:', error);
      throw error;
    }
  }

  /**
   * Get all express orders (admin only)
   */
  static async getExpressOrders(): Promise<ExpressOrder[]> {
    try {
      const { data, error } = await supabase.rpc('get_express_orders');
      
      if (error) {
        console.error('Error fetching express orders:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getExpressOrders:', error);
      throw error;
    }
  }

  /**
   * Update express order status (admin only)
   */
  static async updateExpressOrderStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('is_express_order', true)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating express order status:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateExpressOrderStatus:', error);
      throw error;
    }
  }

  /**
   * Get express orders for today (admin dashboard)
   */
  static async getTodayExpressOrders() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('is_express_order', true)
        .gte('requested_delivery_time', today)
        .lt('requested_delivery_time', today + ' 23:59:59')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching today express orders:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTodayExpressOrders:', error);
      throw error;
    }
  }

  /**
   * Check if express delivery is available (based on time and day)
   */
  static isExpressDeliveryAvailable(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Express delivery available Monday to Saturday, before 2 PM
    const isWorkingDay = currentDay >= 1 && currentDay <= 6;
    const isBeforeCutoff = currentHour < 14; // 2 PM cutoff
    
    return isWorkingDay && isBeforeCutoff;
  }

  /**
   * Get express delivery fee
   */
  static getExpressDeliveryFee(): number {
    return 15000; // Rp 15,000 for express delivery
  }

  /**
   * Get minimum order for express delivery
   */
  static getExpressMinimumOrder(): number {
    return 50000; // Rp 50,000 minimum order
  }
} 