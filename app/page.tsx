"use client";
import Image from "next/image";
import { Button } from "../components/ui/button";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useCart } from "../components/CartContext";

export default function Home() {
  const [categories, setCategories] = useState<{ id: number; name: string; icon_url?: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;
  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);
  const [heroBanners, setHeroBanners] = useState<{ id: number; text: string; image: string }[]>([]);
  
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(heroBanners.length / itemsPerSlide);
  
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const { cart } = useCart();
  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Set default to banner 3 (index 2) and center it on mobile
  useEffect(() => {
    if (mobileCarouselRef.current && heroBanners.length >= 3) {
      // Wait for banners to render
      setTimeout(() => {
        const container = mobileCarouselRef.current as HTMLDivElement | null;
        if (!container) return;
        const bannerEls = container.querySelectorAll('.hero-slide-mobile');
        if (bannerEls.length >= 3) {
          const banner = bannerEls[2] as HTMLElement;
          if (!banner) return;
          const containerWidth = container.offsetWidth;
          const bannerWidth = banner.offsetWidth;
          const bannerLeft = banner.offsetLeft;
          // Center the third banner
          const scrollPosition = bannerLeft - (containerWidth / 2) + (bannerWidth / 2);
          container.scrollLeft = scrollPosition;
        }
      }, 50);
    }
  }, [heroBanners]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from('categories').select('id, name, icon_url').order('id', { ascending: true });
      if (!error && data) {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].id);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchHeroBanners() {
      const { data, error } = await supabase.from('hero-banner').select('*').order('id', { ascending: true });
      if (!error && data) setHeroBanners(data);
    }
    fetchHeroBanners();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchCategory = !isSearching && selectedCategory ? p.category_id === selectedCategory : true;
    const matchSearch = search.trim() === "" || (p.name && p.name.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Infinite scroll: load more products when scrolled to bottom
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredProducts.length));
      }
    }, { threshold: 1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredProducts.length]);

  return (
    <div className="min-h-screen bg-[#ffe9ea] flex flex-col text-black text-base-size">
      {/* Mobile Header with centered logo and cart */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur flex items-center justify-between px-4 py-2 border-b border-gray-200 md:justify-center md:px-8">
        {/* Mobile layout - logo and brand centered, cart on right */}
        <div className="flex items-center justify-center flex-1 gap-2 md:justify-start md:flex-initial">
          <Image src="/logo.png" alt="Jenny's Pudding Logo" width={36} height={36} className="rounded-full bg-white shadow p-1 md:w-12 md:h-12" />
          <span className="text-lg font-extrabold text-[#b48a78] tracking-tight md:text-2xl">Jenny's Pudding</span>
        </div>
        <div className="flex items-center gap-3 md:absolute md:right-8">
          <Link href="/cart" className="relative">
            <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24" className="md:w-8 md:h-8"><path d="M6 6h15l-1.5 9h-13z" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 md:text-sm md:px-2">{totalCartItems}</span>
            )}
          </Link>
        </div>
      </header>
      
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white/95 px-4 py-2 border-b border-gray-200 flex items-center gap-2 md:px-8 md:top-[56px]">
        <div className="desktop-container w-full flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="cari pudding"
            inputMode="search"
            pattern=".*"
            style={{ fontSize: 16 }}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-search-size focus:outline-none focus:ring-2 focus:ring-[#b48a78] bg-white text-black md:px-6 md:py-3"
          />
          <button
            className="ml-2 text-black font-bold text-search-size md:px-4 md:py-2 md:bg-[#b48a78] md:text-white md:rounded-full md:hover:bg-[#a17a6a] md:transition-colors"
            onClick={() => setSearch("")}
            style={{ display: isSearching ? 'block' : 'none' }}
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Hero Banner - Mobile: Swipeable, Desktop: Carousel with buttons */}
      {!isSearching && (
        <section className="w-full flex items-center justify-center bg-[#ffe9ea] h-36 sm:h-40 py-2 hero-gradient-overlay desktop-hero md:h-48 lg:h-56">
          <div className="desktop-container w-full">
            {/* Mobile: Swipeable horizontal scroll */}
            <div 
              ref={mobileCarouselRef}
              className="hero-carousel-mobile flex gap-3 px-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:hidden"
            >
              {heroBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="hero-slide-mobile w-64 h-28 sm:w-80 sm:h-32 rounded-xl shadow-lg flex flex-col justify-end overflow-hidden border border-white/50 relative text-banner-size"
                  style={{ background: 'none', padding: 0 }}
                >
                  <Image
                    src={banner.image}
                    alt={banner.text}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="w-full h-full absolute top-0 left-0 rounded-xl opacity-90"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    priority={true}
                  />
                  <div className="relative z-10 w-full">
                    <span className="block w-full text-center text-black font-bold rounded-b-xl bg-white/70 backdrop-blur-sm py-1 text-banner-size">
                      {banner.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop: Carousel with navigation buttons */}
            <div className="hero-carousel relative hidden md:block">
              <div 
                className="hero-slides"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0 flex justify-center gap-3 px-2">
                    {heroBanners
                      .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                      .map((banner) => (
                        <div
                          key={banner.id}
                          className="w-72 h-40 lg:w-80 lg:h-44 rounded-xl shadow-lg flex flex-col justify-end overflow-hidden border border-white/50 relative text-banner-size"
                          style={{ background: 'none', padding: 0 }}
                        >
                          <Image
                            src={banner.image}
                            alt={banner.text}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="w-full h-full absolute top-0 left-0 rounded-xl opacity-90"
                            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                            priority={slideIndex === 0}
                          />
                          <div className="relative z-10 w-full">
                            <span className="block w-full text-center text-black font-bold rounded-b-xl bg-white/70 backdrop-blur-sm py-1 text-banner-size">
                              {banner.text}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
              
              {/* Navigation Buttons - Desktop only */}
              <button 
                onClick={prevSlide}
                className="hero-nav-button hero-nav-prev"
                disabled={currentSlide === 0}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              
              <button 
                onClick={nextSlide}
                className="hero-nav-button hero-nav-next"
                disabled={currentSlide === totalSlides - 1}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}
      
      {/* Categories - Smaller buttons with same row height */}
      {!isSearching && (
        <section className="category-section">
          <div className="desktop-container">
            <div className="category-container">
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`category-card desktop-category flex items-center justify-center ${selectedCategory === cat.id ? 'selected' : ''}`}
                    style={{ aspectRatio: '1/1', width: 80, height: 80, padding: 0 }}
                  >
                    {cat.icon_url ? (
                      <img src={cat.icon_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : (
                      <span className="category-icon flex items-center justify-center w-full h-full" style={{ fontSize: 36, margin: 'auto' }}>🍮</span>
                    )}
                  </button>
                  <span className="category-text text-black mt-2 text-center font-semibold" style={{ fontSize: 14 }}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Product Grid - Updated layout to match reference image */}
      <section className="mt-4 px-4 w-full max-w-lg mx-auto md:max-w-none md:px-8 pb-20 md:pb-8">
        <div className="desktop-container">
          <h2 className="font-bold text-black mb-4 text-heading-size md:mb-6 md:text-center">
            {isSearching ? `Hasil pencarian: "${search}"` : (selectedCategoryObj?.name || "Produk")}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {filteredProducts.slice(0, visibleCount).length === 0 ? (
              <div className="col-span-2 md:col-span-4 text-center text-gray-400 py-8">Tidak ada produk ditemukan.</div>
            ) : (
              filteredProducts.slice(0, visibleCount).map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 block"
                  prefetch={false}
                >
                  <div className="aspect-square relative">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : '/sample-product.jpg'}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: 1 }}
                    />
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-bold text-black mb-1 text-product-size md:text-base line-clamp-2">{product.name}</h3>
                    <p className="text-black font-semibold text-product-size md:text-base">IDR {product.price?.toLocaleString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {/* Infinite scroll loader trigger */}
          {visibleCount < filteredProducts.length && (
            <div ref={loadMoreRef} className="h-8 w-full flex items-center justify-center text-gray-400 text-xs">Loading more...</div>
          )}
        </div>
      </section>
    </div>
  );
}
