"use client";
import Image from "next/image";
import { Button } from "../../components/ui/button";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useCart } from "../../components/CartContext";
import ProductBadge from '@/components/ProductBadge';
import { ProductGridSkeleton } from '@/components/ProductSkeleton';

export default function ExpressStorePage() {
  const [expressProducts, setExpressProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({});
  const [categories, setCategories] = useState<{ [key: number]: string }>({});
  
  const { cart, addToCart } = useCart();
  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Load express products
  const loadExpressProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_express_item', true)
        .gt('express_stock_quantity', 0)
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
      image: product.images && product.images.length > 0 ? product.images[0] : '/sample-product.jpg',
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
    <div className="min-h-screen relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 glass-navbar backdrop-blur-xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-b border-amber-200/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          {/* Back Button */}
          <Link href="/" className="flex items-center gap-2 text-white hover:text-amber-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Kembali</span>
          </Link>

          {/* Express Store Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⚡</span>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white font-brand md:text-2xl">Express Store</h1>
              <p className="text-xs text-amber-100 md:text-sm">Pengiriman Hari Ini</p>
            </div>
          </div>

          {/* Cart Button */}
          <Link href="/cart" className="relative group">
            <Button variant="glass" size="icon" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-13z" />
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
              </svg>
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold shadow-lg animate-bounce">
                  {totalCartItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Express Store Info Banner */}
      <section className="relative py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 border border-amber-200/50">
            <div className="text-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <span className="text-4xl">🚀</span>
                <h2 className="text-3xl font-bold text-amber-600 font-display md:text-4xl">Express Store</h2>
                <span className="text-4xl">⚡</span>
              </div>
              <p className="text-gray-700 text-lg mb-4 md:text-xl">
                Pudding siap kirim <span className="font-bold text-orange-600">hari ini juga!</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-700 font-medium">Stok Tersedia</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                  <span className="text-blue-600">🕐</span>
                  <span className="text-blue-700 font-medium">Same-Day Delivery</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
                  <span className="text-purple-600">📦</span>
                  <span className="text-purple-700 font-medium">Siap Kirim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Express Products Grid */}
      <section className="relative py-4 px-4 md:py-6 md:px-8 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-amber-700 mb-2 md:text-3xl font-display">
              Produk Express Tersedia
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              {isLoadingProducts ? 'Memuat...' : `${expressProducts.length} produk siap kirim hari ini`}
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full mt-3" />
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
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      Lihat Produk Reguler
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                  {expressProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="group block touch-manipulation"
                      prefetch={false}
                    >
                      <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border-2 border-transparent shadow-lg hover:shadow-xl transition-all duration-300 relative md:hover:scale-[1.02] md:hover:-translate-y-1 active:scale-95 md:active:scale-100 hover:border-amber-200">
                        {/* Express Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-300/20 via-transparent to-orange-300/20 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={product.images && product.images.length > 0 ? product.images[0] : '/sample-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover md:group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            loading={index < 4 ? "eager" : "lazy"}
                            priority={index < 2}
                          />
                          
                          {/* Express Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 md:top-3 md:left-3 md:gap-2">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <span>⚡</span>
                              <span>EXPRESS</span>
                            </div>
                            {product.express_stock_quantity && product.express_stock_quantity < 5 && (
                              <ProductBadge type="stock" text={`${product.express_stock_quantity} tersisa`} />
                            )}
                          </div>
                        </div>
                        
                        {/* Content Area */}
                        <div className="p-3 md:p-5 relative">
                          <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 font-brand text-xs leading-tight md:text-base md:leading-normal group-hover:text-amber-700 transition-colors">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-base font-bold text-amber-600 md:text-xl">
                              Rp {product.price?.toLocaleString('id-ID')}
                            </p>
                            <div className="flex items-center gap-1 text-amber-500">
                              <span className="text-xs font-medium">Stock: {product.express_stock_quantity}</span>
                            </div>
                          </div>
                          
                          {/* Express Add Button */}
                          <button 
                            className={`w-full py-2 text-white text-xs font-semibold rounded-xl transition-all duration-200 md:text-sm ${
                              addingToCart[product.id] 
                                ? 'bg-green-500 hover:bg-green-600 scale-95' 
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:scale-105'
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
                                <span className="mr-1">⚡</span>
                                Tambah Express
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
