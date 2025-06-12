"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";

function formatRupiah(num: number) {
  return "Rp" + num.toLocaleString("id-ID");
}

function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `JP-${timestamp}${random}`;
}

// Toast notification function
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 2000);
}

export default function MidtransPaymentPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Generate order ID
    setOrderId(generateOrderId());
    
    // Load complete order data from localStorage
    const savedOrder = localStorage.getItem("completeOrderData");
    if (savedOrder) {
      const orderData = JSON.parse(savedOrder);
      setOrder(orderData);
    }

    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-704avPSpgSbXlHdg');
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleMidtransPayment = async () => {
    setSubmitting(true);
    
    try {
      // Prepare order data with the generated order ID
      const orderData = { ...order, order_id: orderId };
      
      // Calculate total amount
      const totalAmount = orderData.cartTotal - (orderData.discount || 0) + (orderData.deliveryTotal || 0);
      
      // Prepare Midtrans transaction data
      const transactionData = {
        order_id: orderId,
        gross_amount: totalAmount,
        customer_details: {
          first_name: orderData.formData?.name?.split(' ')[0] || 'Customer',
          last_name: orderData.formData?.name?.split(' ').slice(1).join(' ') || '',
          email: orderData.formData?.email || 'customer@jennyspudding.com',
          phone: orderData.formData?.phone || '08123456789'
        }
      };

      // Create Midtrans transaction
      const response = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to create Midtrans transaction');
      }

      console.log('Midtrans transaction created successfully:', result.token);
      
      // Save order data for thank you page (without inserting to DB yet)
      const finalOrderData = { ...orderData, midtrans_token: result.token };
      localStorage.setItem('completeOrderData', JSON.stringify(finalOrderData));
      
      // Open Midtrans Snap payment popup
      (window as any).snap.pay(result.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          showToast('Pembayaran berhasil!', 'success');
          
          // Clear cart after successful payment
          clearCart();
          sessionStorage.removeItem('cart');
          localStorage.removeItem('cart');
          
          // TODO: Here you can insert the order to Supabase after successful payment
          // await insertCompleteOrder(orderData);
          
          // Redirect to thank you page
          router.push("/thank-you");
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          showToast('Pembayaran sedang diproses...', 'success');
          
          // TODO: Insert order with pending status if needed
          
          router.push("/thank-you");
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          showToast('Pembayaran gagal. Silakan coba lagi.', 'error');
          setSubmitting(false);
        },
        onClose: function() {
          console.log('Payment popup closed');
          showToast('Pembayaran dibatalkan.', 'error');
          setSubmitting(false);
        }
      });
      
    } catch (error) {
      console.error('Error creating Midtrans payment:', error);
      setSubmitting(false);
      showToast('Terjadi kesalahan saat membuat pembayaran. Silakan coba lagi.', 'error');
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">Memuat data pesanan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3" onClick={() => router.back()}>
          <svg width="28" height="28" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Konfirmasi Pesanan - Midtrans</h1>
      </header>

      {/* Order ID Section */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Order ID</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl font-bold text-[#f5e1d8] bg-gray-50 py-3 px-4 rounded-lg">
                {orderId}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(orderId)}
                className="px-3 py-2 text-sm"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information Section */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Informasi Pemesanan</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Nama Pemesan:</span>
              <span className="text-sm font-medium">{order.formData?.name || '-'}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Nomor Telepon:</span>
              <span className="text-sm font-medium">+62{order.formData?.phone || '-'}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Nama Penerima:</span>
              <span className="text-sm font-medium">{order.formData?.recipientName || '-'}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Alamat Pengiriman:</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{order.alamatLengkap || '-'}</span>
            </div>
                     </div>
         </div>
       </div>

       {/* Order Summary Section */}
       <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
         <div className="p-4">
           <h2 className="text-lg font-semibold mb-4">Ringkasan Pemesanan</h2>
           
           <div className="space-y-3">
             {order.cart?.items?.map((item: any, index: number) => (
               <div key={`${item.id}-${index}-${JSON.stringify(item.addOns)}`} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                 <div className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0">
                   <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                 </div>
                 <div className="flex-1">
                   <div className="font-medium text-sm">{item.name}</div>
                   {item.addOns && item.addOns.length > 0 && (
                     <div className="text-xs text-gray-500 mt-1">
                       Add-on: {item.addOns.map((a: any) => a.name).join(", ")}
                     </div>
                   )}
                   <div className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</div>
                 </div>
                 <div className="font-bold text-sm">
                   {formatRupiah(item.price * item.quantity)}
                 </div>
               </div>
             ))}
           </div>

           <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
             <div className="flex justify-between text-base">
               <span>Subtotal</span>
               <span>{formatRupiah(order.cartTotal)}</span>
             </div>
             {order.deliveryQuotation && (
               <div className="flex justify-between text-base">
                 <span>Ongkir</span>
                 <span>{formatRupiah(order.deliveryTotal)}</span>
               </div>
             )}
             {order.promoCode && (
               <div className="flex justify-between text-base">
                 <span>Diskon ({order.promoCode})</span>
                 <span className="text-black">- {formatRupiah(order.discount)}</span>
               </div>
             )}
             <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
               <span>Total</span>
               <span className="text-[#b48a78]">{formatRupiah(order.cartTotal - (order.discount || 0) + (order.deliveryTotal || 0))}</span>
             </div>
           </div>
         </div>
       </div>

       {/* Midtrans Payment Section */}
       <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
         <div className="p-4">
           <h2 className="text-lg font-semibold mb-4">Pembayaran via Midtrans</h2>
           
           {/* Midtrans Info */}
           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                 <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
               </div>
               <div>
                 <h3 className="font-semibold text-blue-800 text-sm mb-1">Pembayaran Digital</h3>
                 <p className="text-blue-700 text-sm leading-relaxed">
                   Bayar dengan mudah menggunakan berbagai metode: Credit Card, Bank Transfer, E-wallet (GoPay, OVO, DANA), dan lainnya.
                 </p>
               </div>
             </div>
           </div>

           <div className="text-center mb-4">
             <div className="text-lg font-semibold text-gray-700 mb-2">Total Pembayaran</div>
             <div className="text-2xl font-bold text-[#b48a78]">
               {formatRupiah(order.cartTotal - (order.discount || 0) + (order.deliveryTotal || 0))}
             </div>
           </div>

           <Button 
             onClick={handleMidtransPayment}
             className="w-full py-4 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg" 
             disabled={submitting}
           >
             {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
           </Button>
         </div>
       </div>
     </div>
   );
 } 