"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/CartContext';

export default function ExpressThankYouPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get express order data from localStorage
    const savedExpressOrderData = localStorage.getItem('completeExpressOrderData');
    if (savedExpressOrderData) {
      const data = JSON.parse(savedExpressOrderData);
      setOrderData(data);
    } else {
      // If no order data, redirect to express store
      router.push('/express-store');
    }
  }, [router]);

  const copyOrderId = async () => {
    if (orderData?.order_id) {
      try {
        await navigator.clipboard.writeText(orderData.order_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy order ID:', err);
      }
    }
  };

  const handleBackToExpressStore = () => {
    // Clear express order data and cart since order was successful
    localStorage.removeItem('completeExpressOrderData');
    localStorage.removeItem('customerFormData');
    localStorage.removeItem('customerMapCenter');
    localStorage.removeItem('customerSelectedLocation');
    localStorage.removeItem('customerAlamatLengkap');
    localStorage.removeItem('customerDeliveryQuotation');
    sessionStorage.removeItem('expressLocationData');
    sessionStorage.removeItem('expressQuotationData');
    sessionStorage.removeItem('currentExpressOrder');
    
    // Clear the cart using context method (more reliable)
    clearCart();
    // Also clear from storage as backup
    sessionStorage.removeItem('cart');
    localStorage.removeItem('cart');
    
    router.push('/express-store');
  };

  const handleBackToHome = () => {
    // Clear express order data and cart since order was successful
    localStorage.removeItem('completeExpressOrderData');
    localStorage.removeItem('customerFormData');
    localStorage.removeItem('customerMapCenter');
    localStorage.removeItem('customerSelectedLocation');
    localStorage.removeItem('customerAlamatLengkap');
    localStorage.removeItem('customerDeliveryQuotation');
    sessionStorage.removeItem('expressLocationData');
    sessionStorage.removeItem('expressQuotationData');
    sessionStorage.removeItem('currentExpressOrder');
    
    // Clear the cart using context method (more reliable)
    clearCart();
    // Also clear from storage as backup
    sessionStorage.removeItem('cart');
    localStorage.removeItem('cart');
    
    router.push('/');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b48a78]"></div>
          <span className="ml-3 text-gray-600">⚡ Memuat data express...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8d7da] to-[#f5e1d8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Animation with Express Badge */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 animate-bounce">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {/* Express Badge on Success Icon */}
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              ⚡ EXPRESS
            </div>
            {/* Floating particles */}
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#b48a78] rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-3 w-2 h-2 bg-[#f5e1d8] rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-[#b48a78] rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          {/* Thank You Message with Express Badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Terima Kasih!</h1>
            <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              ⚡ EXPRESS
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Pesanan <span className="font-bold text-[#b48a78]">EXPRESS</span> Anda telah berhasil dikirim dan sedang kami proses dengan <span className="font-bold text-[#d4a574]">prioritas tinggi</span>.
          </p>

          {/* Order ID Section with Express Styling */}
          <div className="bg-gradient-to-r from-[#f5e1d8] to-[#f0ede8] border-2 border-[#b48a78] rounded-xl p-4 mb-6 relative overflow-hidden">
            {/* Express Lightning Background */}
            <div className="absolute top-1 right-1 text-[#b48a78]/20 text-3xl">⚡</div>
            
            <div className="flex items-center justify-center mb-2 relative z-10">
              <svg className="w-5 h-5 text-[#b48a78] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-[#b48a78] flex items-center gap-1">
                ⚡ ID Pesanan Express
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-3 relative z-10">
              <span className="text-xl font-bold text-[#b48a78] font-mono bg-white px-3 py-1 rounded-lg border border-[#b48a78]">
                {orderData.order_id}
              </span>
              <button
                onClick={copyOrderId}
                className="p-2 bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white rounded-lg hover:from-[#8b5a3c] hover:to-[#b48a78] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Salin ID Pesanan Express"
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            
            {copied && (
              <div className="mt-2 text-xs text-green-600 font-medium animate-fade-in bg-green-100 px-3 py-1 rounded-full inline-block">
                ⚡ ID Pesanan Express berhasil disalin!
              </div>
            )}
          </div>

          {/* Express Payment Info */}
          <div className="bg-gradient-to-r from-[#b48a78]/10 to-[#d4a574]/10 border-2 border-[#b48a78] rounded-xl p-4 mb-6 relative overflow-hidden">
            {/* Express Lightning Background */}
            <div className="absolute bottom-1 left-1 text-[#d4a574]/20 text-2xl">⚡</div>
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg animate-pulse">
                <span className="text-white text-sm">⚡</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-black text-sm mb-1 flex items-center gap-1">
                  <span className="text-[#b48a78]">⚡</span>
                  Express Same-Day Delivery
                </h3>
                <p className="text-black text-sm leading-relaxed">
                  Tim <span className="font-bold text-[#b48a78]">EXPRESS</span> kami akan segera memeriksa bukti pembayaran dan mengirimkan konfirmasi melalui WhatsApp. Pesanan akan dikirim pada <span className="font-bold text-[#d4a574]">HARI YANG SAMA</span> dengan prioritas tinggi!
                </p>
              </div>
            </div>
          </div>

          {/* Express Order Summary */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-center flex items-center justify-center gap-2">
              <span className="text-[#b48a78]">⚡</span>
              Ringkasan Pesanan Express
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between bg-gradient-to-r from-[#b48a78]/5 to-[#d4a574]/5 px-3 py-2 rounded-lg">
                <span className="text-gray-600 flex items-center gap-1">
                  <span className="text-[#b48a78]">⚡</span>
                  Total Produk Express:
                </span>
                <span className="font-medium">Rp{orderData.cartTotal?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between bg-gradient-to-r from-[#b48a78]/5 to-[#d4a574]/5 px-3 py-2 rounded-lg">
                <span className="text-gray-600 flex items-center gap-1">
                  <span className="text-[#b48a78]">🚀</span>
                  Biaya Express Delivery:
                </span>
                <span className="font-medium">Rp{orderData.deliveryTotal?.toLocaleString('id-ID')}</span>
              </div>
              {orderData.promoCode && (
                <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-600">Diskon ({orderData.promoCode}):</span>
                  <span className="text-black">-Rp{orderData.discount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-base bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-1">
                    <span>⚡</span>
                    Total Express:
                  </span>
                  <span>Rp{(orderData.cartTotal - (orderData.discount || 0) + (orderData.deliveryTotal || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleBackToExpressStore}
              className="w-full py-3 text-base rounded-full bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white font-bold hover:from-[#8b5a3c] hover:to-[#b48a78] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="mr-2">⚡</span>
              Belanja Express Lagi
              <span className="ml-2">⚡</span>
            </Button>
            
            <Button 
              onClick={handleBackToHome}
              className="w-full py-3 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg"
            >
              🏠 Kembali ke Beranda
            </Button>
            
            <button 
              onClick={() => window.open('https://wa.me/6281282819898', '_blank')}
              className="w-full py-3 text-base rounded-full border-2 border-[#b48a78] text-[#8b5a3c] font-bold hover:bg-[#f5e1d8] transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-[#b48a78]">⚡</span>
              Hubungi WhatsApp Express
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <span className="text-[#b48a78]">⚡</span>
            Simpan ID pesanan Express Anda untuk referensi
          </p>
        </div>
      </div>
    </div>
  );
} 