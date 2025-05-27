"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { insertCompleteOrder, uploadPaymentProof, updateOrderStatus, updateOrderStatusByUuid } from "@/lib/supabase";
import { testSupabaseConnection, validateOrderData } from "@/lib/test-supabase";

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

// Copy to clipboard function
async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage, 'success');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast(successMessage, 'success');
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate order ID
    setOrderId(generateOrderId());
    
    // Load complete order data from localStorage
    const savedOrder = localStorage.getItem("completeOrderData");
    if (savedOrder) {
      const orderData = JSON.parse(savedOrder);
      setOrder(orderData);
    }
    
    // Test Supabase connection on page load
    testSupabaseConnection();
  }, []);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    setProofFile(file);
    if (file) {
      setErrors((prev: any) => ({ ...prev, proof: null }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const errs: any = {};
    if (!proofFile) errs.proof = "Bukti pembayaran wajib diupload";
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    setSubmitting(true);
    
    try {
      // Prepare order data with the generated order ID
      const orderData = { ...order, order_id: orderId };
      
      // Validate order data before sending
      if (!validateOrderData(orderData)) {
        throw new Error('Order data validation failed. Please check the console for details.');
      }
      
      // Insert order into database
      const orderUuid = await insertCompleteOrder(orderData);
      console.log('Order inserted with UUID:', orderUuid);
      
      // Upload payment proof
      let paymentProofUrl = null;
      if (proofFile) {
        const { filePath } = await uploadPaymentProof(orderId, proofFile);
        paymentProofUrl = filePath;
        console.log('Payment proof uploaded:', filePath);
      }
      
      // Update order status to payment_uploaded using the UUID
      await updateOrderStatusByUuid(orderUuid, 'payment_uploaded', paymentProofUrl);
      console.log('Order status updated to payment_uploaded');
      
      // Save final order data with order_id for thank you page
      const finalOrderData = { ...orderData, uuid: orderUuid, paymentProofUrl };
      localStorage.setItem('completeOrderData', JSON.stringify(finalOrderData));
      
      setSubmitting(false);
      showToast(`Pesanan ${orderId} berhasil dikonfirmasi! Terima kasih.`, 'success');
      
      // Redirect to thank you page after 1 second
      setTimeout(() => {
        router.push("/thank-you");
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitting(false);
      showToast('Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.', 'error');
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = '/qr-jennys-pudding.jpg';
    link.download = 'QR-Payment-Jennys-Pudding.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code berhasil didownload!', 'success');
  };

  const isFormValid = proofFile !== null;

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
        <h1 className="text-lg font-bold flex-1">Konfirmasi Pesanan</h1>
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
                onClick={() => copyToClipboard(orderId, 'Order ID berhasil disalin!')}
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
              <span className="text-sm text-gray-600">Nomor Telepon Penerima:</span>
              <span className="text-sm font-medium">+62{order.formData?.recipientPhone || '-'}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Alamat Pengiriman:</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{order.alamatLengkap || '-'}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Jadwal Pengiriman:</span>
              <span className="text-sm font-medium">
                {order.requestedDateTime ? new Date(order.requestedDateTime).toLocaleString('id-ID') : '-'}
              </span>
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

      {/* Payment Section */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Pembayaran</h2>
          
          {/* BCA Account Information */}
          <div className="bg-[#f5e1d8] border border-[#e9cfc0] rounded-lg p-3 mb-4">
            <h3 className="font-semibold text-[#8b5a3c] mb-2 flex items-center text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Transfer Bank BCA
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-600">Nama Rekening:</div>
                  <div className="font-medium text-sm">Sheren Velia</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-600">Nomor Rekening:</div>
                  <div className="font-mono text-base">6380406045</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('6380406045', 'Nomor rekening berhasil disalin!')}
                  className="px-2 py-1 text-xs h-6"
                >
                  Copy
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-600">Jumlah Transfer:</div>
                  <div className="font-bold text-base text-[#8b5a3c]">{formatRupiah(order.grandTotal)}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(order.grandTotal.toString(), 'Jumlah transfer berhasil disalin!')}
                  className="px-2 py-1 text-xs h-6"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-3">Atau scan QR berikut untuk pembayaran:</p>
            <div className="flex justify-center mb-4">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setShowQRModal(true)}
              >
                <Image 
                  src="/qr-jennys-pudding.jpg" 
                  alt="QR Payment Jenny's Pudding" 
                  width={200} 
                  height={200} 
                  className="rounded-lg border shadow-md" 
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadQRCode}
              className="px-4 py-2 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download QR Code
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Upload Bukti Pembayaran <span className="text-red-500">*</span></label>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-black hover:file:bg-gray-100"
              />
              {errors.proof && <div className="text-xs text-red-500 mt-1">{errors.proof}</div>}
              {proofFile && (
                <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">{proofFile.name}</span>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { 
                      setProofFile(null); 
                      if (fileInputRef.current) fileInputRef.current.value = ""; 
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg" 
              disabled={submitting || !isFormValid}
            >
              {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
            </Button>
          </form>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">QR Code Pembayaran</h3>
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-center">
              <Image 
                src="/qr-jennys-pudding.jpg" 
                alt="QR Payment Jenny's Pudding" 
                width={300} 
                height={300} 
                className="rounded-lg border shadow-md mx-auto" 
              />
              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadQRCode}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 