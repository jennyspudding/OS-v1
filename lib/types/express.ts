// Express Store Types
// Types for the new Express store functionality that supports same-day delivery

export interface ExpressProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_express_item: boolean;
  express_stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  // New express fields
  is_express_item?: boolean;
  express_stock_quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface ExpressOrder {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  vehicle_type: 'MOTORCYCLE' | 'CAR';
  requested_delivery_time: string;
  actual_delivery_time?: string;
  subtotal: number;
  delivery_cost: number;
  total_amount: number;
  status: string;
  is_express_order: boolean;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  total_amount: number;
  status: string;
  // New express field
  is_express_order?: boolean;
  created_at: string;
  requested_delivery_time: string;
}

// Cart item with express support
export interface ExpressCartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  note?: string;
  oldPrice?: number;
  discount?: number;
  addOns?: { id: string; name: string; price: number }[];
  specialRequest?: string;
  // New express fields
  is_express_item?: boolean;
  express_stock_quantity?: number;
}

// Express store configuration
export interface ExpressStoreConfig {
  isEnabled: boolean;
  cutoffTime: string; // e.g., "14:00" for 2 PM
  deliveryFee: number;
  minimumOrder: number;
  operatingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

// Express delivery time slots
export interface ExpressTimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  additionalFee?: number;
}

export const DEFAULT_EXPRESS_TIME_SLOTS: ExpressTimeSlot[] = [
  {
    id: 'morning',
    label: 'Pagi (09:00 - 12:00)',
    startTime: '09:00',
    endTime: '12:00',
    available: true,
  },
  {
    id: 'afternoon',
    label: 'Siang (12:00 - 15:00)',
    startTime: '12:00',
    endTime: '15:00',
    available: true,
  },
  {
    id: 'evening',
    label: 'Sore (15:00 - 18:00)',
    startTime: '15:00',
    endTime: '18:00',
    available: true,
  },
];

// Express order status
export enum ExpressOrderStatus {
  READY_FOR_PAYMENT = 'ready_for_payment',
  PAYMENT_UPLOADED = 'payment_uploaded',
  PAYMENT_VERIFIED = 'payment_verified',
  PAYMENT_REJECTED = 'payment_rejected',
  PROCESSING = 'processing',
  PREPARING = 'preparing',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export const EXPRESS_ORDER_STATUS_LABELS: Record<ExpressOrderStatus, string> = {
  [ExpressOrderStatus.READY_FOR_PAYMENT]: 'Menunggu Pembayaran',
  [ExpressOrderStatus.PAYMENT_UPLOADED]: 'Bukti Pembayaran Dikirim',
  [ExpressOrderStatus.PAYMENT_VERIFIED]: 'Pembayaran Terverifikasi',
  [ExpressOrderStatus.PAYMENT_REJECTED]: 'Pembayaran Ditolak',
  [ExpressOrderStatus.PROCESSING]: 'Sedang Diproses',
  [ExpressOrderStatus.PREPARING]: 'Sedang Disiapkan',
  [ExpressOrderStatus.READY_FOR_DELIVERY]: 'Siap Dikirim',
  [ExpressOrderStatus.OUT_FOR_DELIVERY]: 'Sedang Dikirim',
  [ExpressOrderStatus.DELIVERED]: 'Terkirim',
  [ExpressOrderStatus.CANCELLED]: 'Dibatalkan',
  [ExpressOrderStatus.REFUNDED]: 'Dikembalikan',
}; 