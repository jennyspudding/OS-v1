"use client";
import Image from "next/image";
import { Button } from "../../components/ui/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../components/CartContext";

export default function ExpressCartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  
  // Filter only express items from the cart
  const expressItems = cart.items.filter(item => 
    // @ts-ignore - checking for express flag
    item.isExpress === true || item.source === 'express'
  );
  
  const expressTotal = expressItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalExpressItems = expressItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-navbar backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 relative">
          {/* Mobile: Centered Logo */}
          <div className="flex items-center gap-3 flex-1 justify-center md:hidden">
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="Jenny's Pudding Logo" 
                width={42} 
                height={42} 
                className="rounded-full" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-premium font-brand tracking-tight">
                Jenny's Pudding
              </span>
              <span className="text-xs text-[#b48a78]/70 font-medium">
                Express Cart
              </span>
            </div>
          </div>
          
          {/* Desktop: Centered Logo */}
          <div className="hidden md:flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="Jenny's Pudding Logo" 
                width={56} 
                height={56} 
                className="rounded-full" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-premium font-brand tracking-tight">
                Jenny's Pudding
              </span>
              <span className="text-sm text-[#b48a78]/70 font-medium">
                Express Cart
              </span>
            </div>
          </div>

          {/* Back Button */}
          <Link href="/express-store" className="flex items-center gap-2 text-[#b48a78] hover:text-[#8b5a3c] transition-colors md:absolute md:left-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium hidden md:inline">Kembali ke Express Store</span>
          </Link>
          
          {/* Express Badge */}
          <div className="ml-auto flex items-center gap-2 bg-gradient-to-r from-[#b48a78]/20 to-[#d4a574]/20 px-3 py-1 rounded-full border border-[#b48a78]/30">
            <span className="text-[#b48a78] animate-pulse">⚡</span>
            <span className="text-sm font-medium text-[#8b6f47]">Express</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#b48a78] mb-2 md:text-3xl font-display">
            Keranjang Express
          </h1>
          <p className="text-gray-600">
            {totalExpressItems > 0 ? `${totalExpressItems} item siap kirim hari ini` : 'Keranjang express kosong'}
          </p>
        </div>

        {/* Cart Content */}
        {expressItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🛒</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Keranjang Express Kosong
            </h3>
            <p className="text-gray-500 mb-6">
              Belum ada produk express yang ditambahkan
            </p>
            <Link href="/express-store">
              <Button className="bg-[#b48a78] hover:bg-[#8b5a3c] text-white">
                Belanja Express Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-[#b48a78]">⚡</span>
                  Produk Express ({expressItems.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">Siap kirim hari ini</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {expressItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-xl"
                          sizes="(max-width: 768px) 80px, 96px"
                        />
                        {/* Express Badge */}
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          ⚡
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 line-clamp-2 text-sm md:text-base">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                        
                        {/* Add-ons */}
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Add-ons:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.addOns.map((addon, index) => (
                                <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                                  {addon.name} (+Rp {addon.price.toLocaleString('id-ID')})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Special Request */}
                        {item.specialRequest && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Catatan khusus:</p>
                            <p className="text-xs text-gray-700 bg-yellow-50 px-2 py-1 rounded">
                              {item.specialRequest}
                            </p>
                          </div>
                        )}
                        
                        {/* Price and Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-[#b48a78] md:text-lg">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            {item.addOns && item.addOns.length > 0 && (
                              <span className="text-xs text-gray-500">
                                Total: Rp {((item.price + item.addOns.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#b48a78] transition-colors rounded-md hover:bg-white"
                                disabled={item.quantity <= 1}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center font-medium text-gray-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#b48a78] transition-colors rounded-md hover:bg-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-[#b48a78]">📋</span>
                Ringkasan Express
              </h3>
              
              {/* Express Delivery Info */}
              <div className="bg-gradient-to-r from-[#b48a78]/10 to-[#d4a574]/10 border border-[#b48a78]/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#b48a78]">⚡</span>
                  <span className="font-semibold text-[#8b6f47]">Same-Day Delivery</span>
                </div>
                <p className="text-sm text-[#8b6f47]">
                  Pesanan akan dikirim pada hari yang sama. Pastikan alamat pengiriman sudah benar.
                </p>
              </div>
              
              {/* Cost Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal ({totalExpressItems} item)</span>
                  <span className="font-medium">Rp {expressTotal.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Express</span>
                  <span className="font-medium text-[#b48a78]">Akan dihitung saat checkout</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center text-xl font-bold text-[#b48a78]">
                    <span>Total Sementara:</span>
                    <span>Rp {expressTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">*Belum termasuk ongkos kirim express</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Link href="/express-customer-info">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#b48a78] to-[#d4a574] hover:from-[#8b6f47] hover:to-[#b48a78] text-white py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                    disabled={expressItems.length === 0}
                  >
                    <span className="mr-2">⚡</span>
                    Checkout Express
                  </Button>
                </Link>
                
                <div className="flex gap-2">
                  <Link href="/express-store" className="flex-1">
                    <Button variant="outline" className="w-full border-[#b48a78] text-[#b48a78] hover:bg-[#b48a78] hover:text-white">
                      Tambah Produk
                    </Button>
                  </Link>
                  
                  {expressItems.length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm('Hapus semua produk express dari keranjang?')) {
                          expressItems.forEach(item => removeFromCart(item.id));
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Kosongkan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 