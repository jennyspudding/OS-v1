"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { useRouter } from 'next/navigation';

function formatRupiah(num: number) {
  return "Rp" + num.toLocaleString("id-ID");
}

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const router = useRouter();

  // Calculate total price
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3" onClick={() => router.back()}>
          <svg width="28" height="28" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Keranjang</h1>
        {cart.items.length > 0 && (
          <Button variant="destructive" size="sm" onClick={clearCart} className="ml-auto">Hapus Semua</Button>
        )}
      </header>
      {/* Cart Items - Flat List */}
      <div className="flex flex-col gap-4 mt-2">
        {cart.items.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Keranjang kosong.</div>
        ) : (
          cart.items.map((item, index) => (
            <div key={`${item.id}-${index}-${JSON.stringify(item.addOns)}`} className="bg-white py-2 border-b">
              <div className="flex items-start gap-3 px-4 py-2 border-t h-28 min-h-28 max-h-28 overflow-hidden">
                {/* Image fills the row height */}
                <div className="h-24 w-24 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                </div>
                {/* Product info and add-ons */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-medium text-sm truncate mb-1">{item.name}</div>
                  <div className="flex items-center gap-2 mb-1">
                    {typeof item.oldPrice === 'number' && (
                      <span className="text-xs text-gray-400 line-through">{formatRupiah(item.oldPrice)}</span>
                    )}
                    {"discount" in item && (
                      <span className="text-xs text-pink-500 font-bold">{item.discount}%</span>
                    )}
                  </div>
                  <div className="font-bold text-xs mb-1 text-black">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="flex flex-col gap-0.5 mb-1">
                      {item.addOns.map(a => (
                        <div key={a.id} className="text-xs text-gray-500 truncate">{a.name}</div>
                      ))}
                    </div>
                  )}
                  {item.note && (
                    <div className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold mb-0.5">
                      <span role="img" aria-label="thumbs up">👍</span> {item.note}
                    </div>
                  )}
                </div>
                {/* Actions: quantity and delete, right-aligned */}
                <div className="flex flex-col items-end justify-between h-24 ml-2">
                  <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                    <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" /></svg>
                  </Button>
                  <div className="flex items-center border rounded-full px-2 py-0 bg-gray-100 mt-2 h-7">
                    <Button size="icon" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                      <span className="text-xs">-</span>
                    </Button>
                    <span className="px-2 min-w-[20px] text-center text-xs">{item.quantity}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <span className="text-xs">+</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-2 z-30">
        <span className="font-bold text-base mr-2">Total {formatRupiah(total)}</span>
        <Button 
          onClick={() => router.push('/customer-info')}
          className="w-40 max-w-xs py-3 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg"
        >
          Beli
        </Button>
      </div>
    </div>
  );
} 