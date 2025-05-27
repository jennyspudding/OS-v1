"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get order data from localStorage
    const savedOrderData = localStorage.getItem('completeOrderData');
    if (savedOrderData) {
      const data = JSON.parse(savedOrderData);
      setOrderData(data);
    } else {
      // If no order data, redirect to home
      router.push('/');
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

  const handleBackToHome = () => {
    // Clear order data and cart since order was successful
    localStorage.removeItem('completeOrderData');
    localStorage.removeItem('customerFormData');
    localStorage.removeItem('customerMapCenter');
    localStorage.removeItem('customerSelectedLocation');
    localStorage.removeItem('customerAlamatLengkap');
    localStorage.removeItem('customerDeliveryQuotation');
    sessionStorage.removeItem('customerSessionData');
    sessionStorage.removeItem('currentOrder');
    
    // Clear the cart since order was successfully sent
    sessionStorage.removeItem('cart');
    localStorage.removeItem('cart');
    
    router.push('/');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b48a78]"></div>
          <span className="ml-3 text-gray-600">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8d7da] to-[#f5e1d8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 animate-bounce">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {/* Floating particles */}
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#b48a78] rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-3 w-2 h-2 bg-[#f5e1d8] rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-[#b48a78] rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          {/* Thank You Message */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih!</h1>
          <p className="text-gray-600 mb-6">
            Pesanan Anda telah berhasil dikirim dan sedang kami proses.
          </p>

          {/* Order ID Section */}
          <div className="bg-[#f5e1d8] border border-[#e9cfc0] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-[#b48a78] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-[#b48a78]">ID Pesanan</span>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl font-bold text-[#b48a78] font-mono">
                {orderData.order_id}
              </span>
              <button
                onClick={copyOrderId}
                className="p-2 bg-white border border-[#b48a78] rounded-lg hover:bg-[#f5e1d8] transition-colors"
                title="Salin ID Pesanan"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#b48a78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            
            {copied && (
              <div className="mt-2 text-xs text-green-600 font-medium animate-fade-in">
                ✓ ID Pesanan berhasil disalin!
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-[#f5e1d8] border border-[#e9cfc0] rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#e9cfc0] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#8b5a3c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-black text-sm mb-1">Proses Selanjutnya</h3>
                <p className="text-black text-sm leading-relaxed">
                  Kami akan memeriksa bukti pembayaran Anda dan mengirimkan konfirmasi melalui WhatsApp dalam waktu 1-2 jam.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">Ringkasan Pesanan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Produk:</span>
                <span className="font-medium">Rp{orderData.cartTotal?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Pengiriman:</span>
                <span className="font-medium">Rp{orderData.deliveryTotal?.toLocaleString('id-ID')}</span>
              </div>
              {orderData.promoCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diskon ({orderData.promoCode}):</span>
                  <span className="text-black">-Rp{orderData.discount?.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>Total Pembayaran:</span>
                  <span className="text-[#b48a78]">Rp{(orderData.cartTotal - (orderData.discount || 0) + (orderData.deliveryTotal || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleBackToHome}
              className="w-full py-3 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg"
            >
              Belanja Lagi Yuk
            </Button>
            
            <button 
              onClick={() => window.open('https://wa.me/6281282819898', '_blank')}
              className="w-full py-3 text-base rounded-full border-2 border-[#f5e1d8] text-[#8b5a3c] font-bold hover:bg-[#f5e1d8] transition-colors"
            >
              Hubungi WhatsApp
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Simpan ID pesanan Anda untuk referensi
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 