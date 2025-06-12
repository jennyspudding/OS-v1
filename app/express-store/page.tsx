"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import ProductBadge from '@/components/ProductBadge';
import { ProductGridSkeleton } from '@/components/ProductSkeleton';

export default function ExpressStorePage() {
  const [expressProducts, setExpressProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({});
  const [categories, setCategories] = useState<{ [key: number]: string }>({});
  
  const { cart, addToCart } = useCart();
  
  // Count only express items for the cart badge
  const expressItemsCount = cart.items
    .filter(item => item.isExpress === true || item.source === 'express')
    .reduce((sum, item) => sum + item.quantity, 0);

  // Load express products
  const loadExpressProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('express_products')
        .select('*, categories(name)')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setExpressProducts(data);
      } else {
        console.error('Error loading express products:', error);
      }
    } catch (error) {
      console.error('Error loading express products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load categories for display
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      
      if (!error && data) {
        const catMap = data.reduce((acc: { [key: number]: string }, cat: any) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
        setCategories(catMap);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadExpressProducts(), loadCategories()]);
  }, [loadExpressProducts, loadCategories]);

  // Add to cart function for express items
  const handleQuickAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set loading state for this product
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    // Add to cart with express flag
    addToCart({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '/logo.png',
      price: product.price,
      quantity: 1,
      category: categories[product.category_id] || 'Express',
      addOns: [],
      specialRequest: '',
      // @ts-ignore - extending CartItem interface for express items
      isExpress: true,
      source: 'express'
    });

    // Reset loading state after animation
    setTimeout(() => {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 glass-navbar backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 relative">
          {/* Back Button - positioned normally on the left */}
          <Link href="/" className="flex items-center gap-2 text-[#b48a78] hover:text-[#8b5a3c] transition-colors md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

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
                Premium Artisanal Desserts
              </span>
            </div>
          </div>
          
          {/* Desktop: Back button on left, Logo centered */}
          <Link href="/" className="hidden md:flex items-center gap-2 text-[#b48a78] hover:text-[#8b5a3c] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Kembali</span>
          </Link>
          
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
                Premium Artisanal Desserts
              </span>
            </div>
          </div>
          
          {/* Enhanced Cart Button - Always positioned to the right */}
          <Link href="/express-cart" className="relative group ml-auto">
            <Button variant="glass" size="icon" className="relative overflow-hidden">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="md:w-7 md:h-7">
                <path d="M6 6h15l-1.5 9h-13z" />
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
              </svg>
              {expressItemsCount > 0 && (
                <>
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-bold shadow-lg animate-pulse md:text-sm">
                    {expressItemsCount}
                  </span>
                  <div className="absolute inset-0 bg-[#b48a78]/10 rounded-full animate-ping" />
                </>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Express Store Info Banner */}
      <section className="relative py-3 md:py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#b48a78]/10 via-transparent to-[#d4a574]/10" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-12 border border-white/30">
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 md:gap-4 mb-2 md:mb-6">
                <span className="text-2xl md:text-5xl">🚀</span>
                <h2 className="text-xl font-bold text-[#b48a78] font-display md:text-5xl">Express Store</h2>
                <span className="text-2xl md:text-5xl animate-pulse text-[#b48a78]">⚡</span>
              </div>
              <p className="text-gray-700 text-sm mb-3 md:text-2xl md:mb-6">
                Pudding siap kirim <span className="font-bold text-[#b48a78]">hari ini juga!</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-6 text-xs md:text-lg">
                <div className="flex items-center gap-1 md:gap-3 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 px-3 py-1 md:px-6 md:py-3 rounded-full border border-amber-300/50 md:shadow-xl">
                  <span className="text-amber-600">✓</span>
                  <span className="text-amber-700 font-medium bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent">Stok Tersedia</span>
                </div>
                <div className="flex items-center gap-1 md:gap-3 bg-gradient-to-r from-slate-100 via-gray-50 to-slate-100 px-3 py-1 md:px-6 md:py-3 rounded-full border border-slate-300/50 md:shadow-xl">
                  <span className="text-slate-600">🕐</span>
                  <span className="text-slate-700 font-medium bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">Same-Day Delivery</span>
                </div>
                <div className="flex items-center gap-1 md:gap-3 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 px-3 py-1 md:px-6 md:py-3 rounded-full border border-amber-300/50 md:shadow-xl">
                  <span className="text-amber-600">📦</span>
                  <span className="text-amber-700 font-medium bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent">Siap Kirim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storewide Discount Banner */}
      <section className="relative py-2 md:py-4 px-4 md:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-lg md:rounded-2xl shadow-sm md:shadow-lg p-3 md:p-6 text-white relative overflow-hidden">
            <div className="relative text-center">
              <p className="text-sm md:text-lg font-medium">
                Diskon 10% untuk pembelian min. Rp 175.000 • Otomatis diterapkan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Express Products Grid */}
      <section className="relative py-4 px-4 md:py-6 md:px-8 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-[#b48a78] mb-2 md:text-3xl font-display">
              Produk Express Tersedia
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              {isLoadingProducts ? 'Memuat...' : `${expressProducts.length} produk siap kirim hari ini`}
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-[#b48a78] to-[#d4a574] mx-auto rounded-full mt-3" />
          </div>

          {/* Loading State */}
          {isLoadingProducts ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <>
              {expressProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">😔</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Belum Ada Produk Express
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Produk express sedang tidak tersedia saat ini
                  </p>
                  <Link href="/">
                    <Button className="bg-[#b48a78] hover:bg-[#8b5a3c] text-white">
                      Lihat Produk Reguler
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                  {expressProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/express-product/${product.id}`}
                      className="group block touch-manipulation"
                      prefetch={false}
                    >
                      <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border-2 border-transparent shadow-lg hover:shadow-xl transition-all duration-300 relative md:hover:scale-[1.02] md:hover:-translate-y-1 active:scale-95 md:active:scale-100 hover:border-amber-200">
                        {/* Premium Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b48a78]/20 via-transparent to-[#d4a574]/20 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={product.images && product.images.length > 0 ? product.images[0] : '/logo.png'}
                            alt={product.name}
                            fill
                            className="object-cover md:group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            loading={index < 4 ? "eager" : "lazy"}
                            priority={index < 2}
                          />
                          
                          {/* Enhanced Product Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 md:top-3 md:left-3 md:gap-2">
                            <ProductBadge type="ready" text="Same Day" />
                            {product.stock_quantity && product.stock_quantity < 5 && (
                              <ProductBadge type="stock" text={`${product.stock_quantity} tersisa`} />
                            )}
                          </div>
                          
                          {/* Wishlist Button - Hidden on mobile, shown on desktop */}
                          <button 
                            className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 hover:bg-white md:top-3 md:right-3 md:w-8 md:h-8 hidden md:flex"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle wishlist logic here
                            }}
                          >
                            <svg className="w-3 h-3 text-red-500 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          
                          {/* Gradient Overlay - Only on desktop */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:block" />
                        </div>
                        
                        {/* Premium Content Area */}
                        <div className="p-3 md:p-5 relative">
                          {/* Premium Bottom Border */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-300" />
                          <h3 className="font-bold text-[#b48a78] mb-2 line-clamp-2 font-brand text-xs leading-tight md:text-base md:leading-normal group-hover:text-[#8b6f47] transition-colors">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <p className="text-base font-bold text-[#b48a78] md:text-xl">
                              Rp {product.price?.toLocaleString('id-ID')}
                            </p>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <svg className="w-3 h-3 fill-current md:w-4 md:h-4" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                              </svg>
                              <span className="text-xs font-medium text-[#b48a78] md:text-sm">4.8</span>
                            </div>
                          </div>
                          
                          {/* Quick Add Button - Only show on desktop */}
                          <button 
                            className={`w-full py-2 text-white text-xs font-semibold rounded-xl opacity-0 md:group-hover:opacity-100 transition-all duration-200 transform translate-y-2 md:group-hover:translate-y-0 hover:from-[#8b6f47] hover:to-[#b48a78] hidden md:block ${
                              addingToCart[product.id] 
                                ? 'bg-green-500 hover:bg-green-600 scale-95' 
                                : 'bg-gradient-to-r from-[#b48a78] to-[#d4a574] hover:scale-105'
                            }`}
                            onClick={(e) => handleQuickAddToCart(product, e)}
                            disabled={addingToCart[product.id]}
                          >
                            {addingToCart[product.id] ? (
                              <>
                                <svg className="w-3 h-3 mr-1 inline-block animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Menambahkan...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Tambah ke Keranjang
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
