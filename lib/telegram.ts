// Telegram Bot Integration for Order Notifications
// This module handles sending order confirmations to Telegram

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress: string;
  deliveryDateTime: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addOns?: Array<{ name: string; price: number }>;
  }>;
  cartTotal: number;
  deliveryTotal: number;
  discount?: number;
  promoCode?: string;
  grandTotal: number;
  orderType: 'normal' | 'express';
  vehicleType?: string;
  paymentMethod: string;
}

class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  private enabled: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';
  }

  private isConfigured(): boolean {
    return this.enabled && this.botToken !== '' && this.chatId !== '';
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private formatOrderMessage(order: OrderData): string {
    const isExpress = order.orderType === 'express';
    const emoji = isExpress ? '⚡' : '🍮';
    const orderTypeText = isExpress ? 'EXPRESS' : 'NORMAL';
    
    let message = `${emoji} <b>PESANAN ${orderTypeText} DITERIMA!</b>\n\n`;
    
    // Order ID
    message += `📋 <b>ID Pesanan:</b> ${order.orderId}\n\n`;
    
    // Customer Info
    message += `👤 <b>Pelanggan:</b>\n`;
    message += `   • Nama: ${order.customerName}\n`;
    message += `   • HP: ${order.customerPhone}\n`;
    
    if (order.recipientName && order.recipientName !== order.customerName) {
      message += `   • Penerima: ${order.recipientName}\n`;
      message += `   • HP Penerima: ${order.recipientPhone}\n`;
    }
    message += `\n`;
    
    // Delivery Info
    message += `🚚 <b>Pengiriman:</b>\n`;
    message += `   • Alamat: ${order.deliveryAddress}\n`;
    message += `   • Waktu: ${new Date(order.deliveryDateTime).toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'short'
    })} WIB\n`;
    
    if (isExpress && order.vehicleType) {
      const vehicle = order.vehicleType === 'MOTORCYCLE' ? 'Motor' : 'Mobil';
      message += `   • Kendaraan: ${vehicle}\n`;
    }
    message += `\n`;
    
    // Order Items
    message += `🛒 <b>Pesanan:</b>\n`;
    order.items.forEach((item, index) => {
      message += `   ${index + 1}. ${item.name} (${item.quantity}x)\n`;
      message += `      ${this.formatCurrency(item.price * item.quantity)}\n`;
      
      if (item.addOns && item.addOns.length > 0) {
        item.addOns.forEach(addOn => {
          message += `      + ${addOn.name} (${this.formatCurrency(addOn.price * item.quantity)})\n`;
        });
      }
    });
    message += `\n`;
    
    // Payment Summary
    message += `💰 <b>Ringkasan Pembayaran:</b>\n`;
    message += `   • Subtotal: ${this.formatCurrency(order.cartTotal)}\n`;
    message += `   • Ongkir: ${this.formatCurrency(order.deliveryTotal)}\n`;
    
    if (order.discount && order.discount > 0) {
      const discountText = order.promoCode ? `Diskon (${order.promoCode})` : 'Diskon';
      message += `   • ${discountText}: -${this.formatCurrency(order.discount)}\n`;
    }
    
    message += `   • <b>TOTAL: ${this.formatCurrency(order.grandTotal)}</b>\n\n`;
    
    // Payment Method
    message += `💳 <b>Pembayaran:</b> ${order.paymentMethod}\n\n`;
    
    // Footer
    message += `⏰ Diterima: ${new Date().toLocaleString('id-ID', { 
      timeZone: 'Asia/Jakarta' 
    })} WIB`;
    
    return message;
  }

  async sendOrderNotification(order: OrderData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Telegram notifications not configured, skipping...');
      return false;
    }

    try {
      const message = this.formatOrderMessage(order);
      
      const telegramMessage: TelegramMessage = {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      };

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramMessage)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram API error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Telegram notification sent successfully:', result.message_id);
      return true;

    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
      return false;
    }
  }

  async sendTestMessage(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Telegram notifications not configured');
      return false;
    }

    try {
      const testMessage: TelegramMessage = {
        chat_id: this.chatId,
        text: '🧪 <b>Test Notification</b>\n\nJenny\'s Pudding notification system is working correctly!\n\n⏰ ' + 
              new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
        parse_mode: 'HTML'
      };

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send test message:', error);
      return false;
    }
  }
}

// Export singleton instance
export const telegramNotifier = new TelegramNotifier();

// Export types for use in other files
export type { OrderData }; 