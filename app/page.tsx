"use client";
import Image from "next/image";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useCart } from "../components/CartContext";
import ProductBadge from '@/components/ProductBadge';
import { ProductGridSkeleton } from '@/components/ProductSkeleton';
import CategoryIcon from '@/components/CategoryIcon';
import CategoryIconSkeleton from '@/components/CategoryIconSkeleton';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

// Define the Category type including ranking
interface Category {
  id: string; // Always convert to string for consistency
  name: string;
  icon_url?: string;
  ranking?: number; // Make ranking optional in case it's not set
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;
  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);
  const [heroBanners, setHeroBanners] = useState<{ id: number; text: string; image: string }[]>([]);
  const [heroBannerVisible, setHeroBannerVisible] = useState<boolean>(true);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(heroBanners.length / itemsPerSlide);
  
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const { cart, addToCart } = useCart();
  const totalCartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Function to scroll category icons to selected category
  const scrollToSelectedCategory = (categoryId: string) => {
    if (!categoryScrollRef.current) return;
    
    const categoryIndex = categories.findIndex(cat => String(cat.id) === categoryId);
    if (categoryIndex === -1) return;
    
    const scrollContainer = categoryScrollRef.current;
    const categoryElements = scrollContainer.querySelectorAll('.category-item');
    
    if (categoryElements[categoryIndex]) {
      const categoryElement = categoryElements[categoryIndex] as HTMLElement;
      const containerWidth = scrollContainer.clientWidth;
      const elementLeft = categoryElement.offsetLeft;
      const elementWidth = categoryElement.clientWidth;
      
      // Calculate scroll position to center the selected category
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      scrollContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  // Category navigation functions
  const navigateToNextCategory = () => {
    if (isTransitioning || categories.length === 0) return;
    
    const currentIndex = categories.findIndex(cat => String(cat.id) === selectedCategory);
    const nextIndex = (currentIndex + 1) % categories.length;
    
    setIsTransitioning(true);
    setSwipeDirection('left');
    
    setTimeout(() => {
      setSelectedCategory(String(categories[nextIndex].id));
      scrollToSelectedCategory(String(categories[nextIndex].id));
      setTimeout(() => {
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 150);
    }, 150);
  };

  const navigateToPreviousCategory = () => {
    if (isTransitioning || categories.length === 0) return;
    
    const currentIndex = categories.findIndex(cat => String(cat.id) === selectedCategory);
    const prevIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
    
    setIsTransitioning(true);
    setSwipeDirection('right');
    
    setTimeout(() => {
      setSelectedCategory(String(categories[prevIndex].id));
      scrollToSelectedCategory(String(categories[prevIndex].id));
      setTimeout(() => {
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 150);
    }, 150);
  };
  
  // Swipe gesture for category navigation
  const { swipeHandlers, isSwipeActive } = useSwipeGesture({
    onSwipeLeft: navigateToNextCategory,
    onSwipeRight: navigateToPreviousCategory,
    minSwipeDistance: 60,
    maxSwipeTime: 400
  });

  // Auto-scroll to selected category when it changes
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToSelectedCategory(selectedCategory);
      }, 100);
    }
  }, [selectedCategory, categories]);

  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  
  // Set default to banner 2 (index 1) and center it on mobile
  useEffect(() => {
    if (mobileCarouselRef.current && heroBanners.length >= 2) {
      setTimeout(() => {
        const container = mobileCarouselRef.current as HTMLDivElement | null;
        if (!container) return;
        const bannerEls = container.querySelectorAll('.hero-slide-mobile');
        if (bannerEls.length >= 2) {
          const banner = bannerEls[1] as HTMLElement;
          if (!banner) return;
          const containerWidth = container.offsetWidth;
          const bannerWidth = banner.offsetWidth;
          const bannerLeft = banner.offsetLeft;
          const scrollPosition = bannerLeft - (containerWidth / 2) + (bannerWidth / 2);
          container.scrollLeft = scrollPosition;
        }
      }, 50);
    }
  }, [heroBanners]);
  
  // Reset carousel position when banners change
  useEffect(() => {
    if (heroBanners.length > 0) {
      setCurrentSlide(0);
    }
  }, [heroBanners.length]);
  
  const nextSlide = () => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }
  };
  
  const prevSlide = () => {
    if (totalSlides > 1) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  // Load products with loading state
  const loadProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load categories with optimized loading and aggressive preloading
  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      
      // Load all category data at once to avoid timing issues
      const { data: fullData, error: fullError } = await supabase
        .from('categories')
        .select('id, name, icon_url, ranking')
        .order('ranking', { ascending: true });
      
      if (fullError) {
        console.error('❌ Error loading categories:', fullError);
      } else if (!fullData || fullData.length === 0) {
        console.warn('⚠️ No categories found in database');
      } else {
        console.log('📦 Loaded categories:', fullData.map(cat => ({ 
          id: cat.id,
          name: cat.name, 
          hasIcon: !!cat.icon_url,
          iconType: cat.icon_url?.startsWith('data:image/') ? 'admin-upload' : 'external-url',
          iconPreview: cat.icon_url ? cat.icon_url.substring(0, 50) + '...' : 'No icon',
          ranking: cat.ranking
        })));
        
        // Convert IDs to strings for consistency
        const categoriesWithStringIds = fullData.map(cat => ({
          ...cat,
          id: String(cat.id)
        }));
        
        setCategories(categoriesWithStringIds as Category[]);
        
        // Find "Pudding Loyang" category or default to first category
        const puddingLoyangCategory = categoriesWithStringIds.find(cat => 
          cat.name.toLowerCase().includes('pudding loyang') || 
          cat.name.toLowerCase().includes('loyang')
        );
        
        if (puddingLoyangCategory) {
          setSelectedCategory(puddingLoyangCategory.id);
        } else if (categoriesWithStringIds.length > 0) {
          setSelectedCategory(categoriesWithStringIds[0].id);
        }
        
        // Only proceed with preloading if we have the converted data
        if (categoriesWithStringIds) {
          // Enhanced preloading strategy for category icons - only for priority icons
          const priorityPreloadPromises = categoriesWithStringIds.slice(0, 3).map((category: Category, index: number) => {
            if (!category.icon_url) return Promise.resolve();
            
            return new Promise<void>((resolve) => {
              const img = new window.Image();
              
              img.loading = 'eager';
              img.fetchPriority = 'high';
              img.crossOrigin = 'anonymous';
              img.decoding = 'async';
              
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Don't fail the whole process
              
              // Start preloading
              img.src = category.icon_url!;
              
              // Shorter timeout for priority icons
              setTimeout(() => resolve(), 1000);
            });
          });
          
          // Preload priority icons immediately
          Promise.allSettled(priorityPreloadPromises).then(() => {
            console.log('Priority category icons preloaded');
          });
          
          // Lazy preload remaining icons after a delay
          setTimeout(() => {
            const remainingPreloadPromises = categoriesWithStringIds.slice(3).map((category: Category) => {
              if (!category.icon_url) return Promise.resolve();
              
              return new Promise<void>((resolve) => {
                const img = new window.Image();
                img.loading = 'lazy';
                img.fetchPriority = 'low';
                img.crossOrigin = 'anonymous';
                img.decoding = 'async';
                
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = category.icon_url!;
                
                setTimeout(() => resolve(), 3000);
              });
            });
            
            Promise.allSettled(remainingPreloadPromises).then(() => {
              console.log('All category icons preloaded');
            });
          }, 500); // Delay non-priority preloading
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Load banners with loading state
  const loadBanners = useCallback(async () => {
    try {
      setIsLoadingBanners(true);
      
      // First check if hero banner is visible via API
      let isVisible = true; // Default to visible
      try {
        // Use admin app URL - in development: localhost:3001, in production: use env variable
        const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
        const settingsResponse = await fetch(`${adminApiUrl}/api/hero-banner-settings`);
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          isVisible = settingsData.is_visible;
          console.log('🎛️ Hero banner visibility setting:', isVisible);
        }
      } catch (error) {
        console.error('Error fetching hero banner settings:', error);
        // Keep default value of true
      }
      
      setHeroBannerVisible(isVisible);
      
      // Only load banners if hero banner is visible
      if (!isVisible) {
        setHeroBanners([]);
        return;
      }
      
      // Try to get banners from database
      const { data: bannerData, error: bannerError } = await supabase
        .from('hero-banner')
        .select('*')
        .order('id', { ascending: true });
      
      if (!bannerError && bannerData && bannerData.length > 0) {
        setHeroBanners(bannerData);
      } else {
        // If no database banners, try to get from storage
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('hero-banner')
          .list('', { limit: 10, sortBy: { column: 'name', order: 'asc' } });
        
        if (!storageError && storageFiles && storageFiles.length > 0) {
          const bannersFromStorage = storageFiles
            .filter(file => file.name.startsWith('banner-') && file.name.endsWith('.png'))
            .slice(0, 5)
            .map((file, index) => {
              const { data: publicUrlData } = supabase.storage
                .from('hero-banner')
                .getPublicUrl(file.name);
              
              return {
                id: index + 1,
                text: `Pudding Special ${index + 1}`,
                image: publicUrlData.publicUrl
              };
            });
          
          if (bannersFromStorage.length > 0) {
            setHeroBanners(bannersFromStorage);
          } else {
            // Final fallback
            setHeroBanners([
              {
                id: 1,
                text: "Pudding Coklat Premium",
                image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop"
              },
              {
                id: 2,
                text: "Pudding Mangga Segar",
                image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=400&fit=crop"
              },
              {
                id: 3,
                text: "Pudding Strawberry Delight",
                image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop"
              }
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      // Set fallback banners on error
      setHeroBanners([
        {
          id: 1,
          text: "Pudding Coklat Premium",
          image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop"
        },
        {
          id: 2,
          text: "Pudding Mangga Segar", 
          image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=400&fit=crop"
        },
        {
          id: 3,
          text: "Pudding Strawberry Delight",
          image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop"
        }
      ]);
    } finally {
      setIsLoadingBanners(false);
    }
  }, []);

  useEffect(() => {
    // Load data in parallel for better performance
    Promise.all([
      loadProducts(),
      loadCategories(),
      loadBanners()
    ]);
  }, [loadProducts, loadCategories, loadBanners]);

  // AI-powered search suggestions
  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) return [];
    
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();
    
    // Add product name matches
    products.forEach(product => {
      if (product.name && product.name.toLowerCase().includes(queryLower)) {
        suggestions.add(product.name);
      }
    });
    
    // Add category matches
    categories.forEach(category => {
      if (category.name && category.name.toLowerCase().includes(queryLower)) {
        suggestions.add(category.name);
      }
    });
    
    // Add smart suggestions based on partial matches
    const smartSuggestions = [
      'Pudding Coklat', 'Pudding Mangga', 'Pudding Strawberry', 'Pudding Vanilla',
      'Cake Ulang Tahun', 'Brownies', 'Tart Buah', 'Kue Lapis',
      'Dessert Premium', 'Makanan Penutup', 'Kue Basah', 'Kue Kering'
    ];
    
    smartSuggestions.forEach(suggestion => {
      if (suggestion.toLowerCase().includes(queryLower)) {
        suggestions.add(suggestion);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  };

  // Enhanced search with fuzzy matching
  const enhancedSearch = (query: string, products: any[]) => {
    if (!query.trim()) return products;
    
    const queryLower = query.toLowerCase();
    const words = queryLower.split(' ').filter(word => word.length > 0);
    
    return products.filter(product => {
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      
      // Exact match gets highest priority
      if (productName.includes(queryLower)) return true;
      
      // Partial word matches
      const nameWords = productName.split(' ');
      const hasWordMatch = words.some((queryWord: string) => 
        nameWords.some((nameWord: string) => 
          nameWord.includes(queryWord) || queryWord.includes(nameWord)
        )
      );
      
      if (hasWordMatch) return true;
      
      // Description search
      if (productDesc.includes(queryLower)) return true;
      
      // Fuzzy matching for typos (simple implementation)
      const similarity = calculateSimilarity(queryLower, productName);
      return similarity > 0.6;
    });
  };

  // Simple similarity calculation for fuzzy search
  const calculateSimilarity = (str1: string, str2: string) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const suggestions = generateSearchSuggestions(value);
    setSearchSuggestions(suggestions);
    setShowSuggestions(value.trim().length > 0 && suggestions.length > 0);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchCategory = !isSearching && selectedCategory ? p.category_id === selectedCategory : true;
    if (isSearching) {
      const searchResults = enhancedSearch(search, products);
      return searchResults.includes(p);
    }
    return matchCategory;
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

  // Add to cart function
  const handleQuickAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set loading state for this product
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    // Add to cart
    addToCart({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '/sample-product.jpg',
      price: product.price,
      quantity: 1,
      category: 'Uncategorized',
      addOns: [],
      specialRequest: '',
    });

    // Reset loading state after animation
    setTimeout(() => {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Header with Glass Morphism */}
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
                Premium Artisanal Desserts
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
                Premium Artisanal Desserts
              </span>
            </div>
          </div>
          
          {/* Enhanced Cart Button - Always positioned to the right */}
          <Link href="/cart" className="relative group ml-auto">
            <Button variant="glass" size="icon" className="relative overflow-hidden">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="md:w-7 md:h-7">
                <path d="M6 6h15l-1.5 9h-13z" />
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
              </svg>
              {totalCartItems > 0 && (
                <>
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 font-bold shadow-lg animate-pulse md:text-sm">
                    {totalCartItems}
                  </span>
                  <div className="absolute inset-0 bg-[#b48a78]/10 rounded-full animate-ping" />
                </>
              )}
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Enhanced Search Bar */}
      <div className="sticky top-[72px] z-10 glass-navbar backdrop-blur-xl px-3 py-2 border-b border-white/10 md:px-8 md:py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 md:gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none md:pl-4">
              <svg className="h-4 w-4 text-[#b48a78]/60 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(search.trim().length > 0 && searchSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Cari pudding favorit Anda... 🤖 AI-powered"
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#b48a78]/20 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b48a78] focus:border-transparent transition-all duration-200 placeholder-[#b48a78]/60 shadow-lg md:pl-12 md:pr-4 md:py-3 md:rounded-2xl md:text-base"
              style={{ fontSize: 16 }}
            />
            {isSearching && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center md:pr-4"
                onClick={() => {
                  setSearch("");
                  setShowSuggestions(false);
                  setSearchSuggestions([]);
                }}
              >
                <svg className="h-4 w-4 text-[#b48a78]/60 hover:text-[#b48a78] transition-colors md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* AI-Powered Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#b48a78]/20 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#b48a78]/70 border-b border-[#b48a78]/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Saran AI</span>
                  </div>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-[#b48a78]/5 rounded-lg transition-colors text-sm text-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-[#b48a78]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Hero Banner */}
      {!isSearching && heroBannerVisible && (
        <section className="relative w-full py-1 md:py-2">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffe9ea]/50 via-transparent to-[#fef3f3]/50" />
          <div className="relative max-w-7xl mx-auto px-3 md:px-8">
            {/* Mobile: Enhanced Swipeable Carousel */}
            <div 
              ref={mobileCarouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-premium snap-x snap-mandatory md:hidden pb-2"
            >
              {heroBanners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="hero-slide-mobile w-72 h-32 sm:w-80 sm:h-36 snap-center flex-shrink-0 relative group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300 border border-white/20"
                >
                  <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '128px' }}>
                    <Image
                      src={banner.image}
                      alt={banner.text}
                      fill
                      className="object-cover transition-transform duration-300 group-active:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="block text-white font-bold text-sm font-brand drop-shadow-lg sm:text-base">
                        {banner.text}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop: Enhanced Carousel */}
            <div className="hero-carousel relative hidden md:block min-h-[200px] lg:min-h-[240px]">
              {!isLoadingBanners && heroBanners.length > 0 && (
                <>
                  <div 
                    className="hero-slides transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {Array.from({ length: Math.max(1, totalSlides) }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full h-full flex-shrink-0 flex justify-center items-center gap-6 py-4">
                        {heroBanners
                          .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                          .map((banner) => (
                            <div
                              key={banner.id}
                              className="w-80 h-48 lg:w-96 lg:h-56 relative group cursor-pointer flex-shrink-0 rounded-3xl overflow-hidden shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.18)] transition-all duration-500 border border-white/30"
                            >
                              <div className="relative w-full h-full overflow-hidden rounded-3xl" style={{ minHeight: '192px' }}>
                                <Image
                                  src={banner.image}
                                  alt={banner.text}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  sizes="(min-width: 1024px) 384px, 320px"
                                  priority={slideIndex === 0 && banner.id === heroBanners[0]?.id}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                  <span className="block text-white font-bold text-xl font-brand drop-shadow-lg">
                                    {banner.text}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Navigation Buttons - Only show if more than one slide */}
                  {totalSlides > 1 && (
                    <>
                      <Button 
                        onClick={prevSlide}
                        variant="glass"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                        disabled={currentSlide === 0}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </Button>
                      
                      <Button 
                        onClick={nextSlide}
                        variant="glass"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                        disabled={currentSlide === totalSlides - 1}
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Button>
                    </>
                  )}
                </>
              )}
              
              {/* Loading state for desktop */}
              {isLoadingBanners && (
                <div className="flex justify-center items-center gap-6 h-full py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-80 h-48 lg:w-96 lg:h-56 bg-gray-200 rounded-3xl animate-pulse flex-shrink-0" />
                  ))}
                </div>
              )}
              
              {/* No banners fallback for desktop */}
              {!isLoadingBanners && heroBanners.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="w-80 h-48 lg:w-96 lg:h-56 bg-gradient-to-br from-[#ffe9ea] to-[#fef3f3] rounded-3xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🍮</div>
                      <span className="text-[#b48a78] font-semibold">Coming Soon</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Enhanced Categories Section */}
      {!isSearching && (
        <section className="relative py-0.5 md:py-1">
          <div className="max-w-7xl mx-auto px-3 md:px-8">
            <div 
              ref={categoryScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-premium snap-x snap-mandatory pb-1 pt-1 md:justify-center md:flex-wrap md:gap-4 md:overflow-visible md:pb-0"
            >
              
              {/* Express Store - First Category Item */}
              <div className="category-item flex flex-col items-center snap-start min-w-[72px] pt-2">
                <Link 
                  href="/express-store"
                  className="relative group w-14 h-14 flex items-center justify-center md:w-16 md:h-16 mb-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center md:w-16 md:h-16 shadow-xl border-2 border-yellow-300/80 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    {/* Premium shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-yellow-200/50 to-transparent transform -skew-x-12 group-hover:animate-pulse"></div>
                    {/* Secondary shine */}
                    <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/20 to-yellow-100/30 transform skew-x-12"></div>
                    <span className="text-xl md:text-2xl animate-pulse relative z-10 drop-shadow-sm">⚡</span>
                  </div>
                  {/* Same Day Badge - Upper Left */}
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-md font-bold shadow-lg transform -rotate-12 whitespace-nowrap border border-green-400/50">
                    Same Day
                  </div>
                </Link>
                <span className="text-xs font-medium text-center font-brand max-w-[72px] leading-tight text-amber-700 md:text-sm font-bold">
                  Express
                </span>
              </div>

              {/* Regular Categories */}
              {isLoadingCategories ? (
                <CategoryIconSkeleton count={6} />
              ) : (
                categories.map((cat, index) => (
                  <CategoryIcon
                    key={cat.id}
                    iconUrl={cat.icon_url}
                    categoryName={cat.name}
                    isSelected={selectedCategory === String(cat.id)}
                    onClick={() => {
                      setSelectedCategory(String(cat.id));
                      scrollToSelectedCategory(String(cat.id));
                    }}
                    size="md"
                    priority={index < 3} // High priority for first 3 visible categories
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Enhanced Product Grid */}
      <section 
        className="relative py-1 px-3 md:py-2 md:px-8 pb-24 md:pb-16"
        {...swipeHandlers}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-2 text-center md:mb-4">
            <div className="relative overflow-hidden">
              <h2 className={`text-2xl font-bold text-display text-[#b48a78] mb-2 md:text-4xl font-display transition-all duration-300 ${
                isTransitioning 
                  ? swipeDirection === 'left' 
                    ? 'transform -translate-x-full opacity-0' 
                    : 'transform translate-x-full opacity-0'
                  : 'transform translate-x-0 opacity-100'
              }`}>
                {isSearching ? `Hasil Pencarian` : (selectedCategoryObj?.name || "Semua Produk")}
              </h2>
              
              {/* Navigation indicators */}
              <div className="flex justify-center items-center mt-2 space-x-4">
                {/* Desktop navigation arrows */}
                <button
                  onClick={navigateToPreviousCategory}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-[#b48a78]/10 hover:bg-[#b48a78]/20 transition-all duration-200 hover:scale-110"
                  disabled={isTransitioning}
                >
                  <svg className="w-4 h-4 text-[#b48a78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                                 {/* Mobile swipe indicator */}
                 <div className="md:hidden flex items-center space-x-1">
                   <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                     isTransitioning && swipeDirection === 'right' 
                       ? 'bg-[#b48a78] scale-125' 
                       : 'bg-[#b48a78]/30'
                   }`} />
                   <div className={`text-xs px-2 transition-colors duration-300 ${
                     isTransitioning 
                       ? 'text-[#b48a78] font-semibold' 
                       : 'text-[#b48a78]/60'
                   }`}>
                     {isTransitioning ? 'Switching...' : 'Swipe untuk ganti kategori'}
                   </div>
                   <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                     isTransitioning && swipeDirection === 'left' 
                       ? 'bg-[#b48a78] scale-125' 
                       : 'bg-[#b48a78]/30'
                   }`} />
                 </div>

                {/* Category position indicator */}
                <div className="hidden md:flex items-center space-x-1">
                  {categories.map((cat, index) => {
                    const currentIndex = categories.findIndex(c => String(c.id) === selectedCategory);
                    return (
                      <div
                        key={cat.id}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex 
                            ? 'bg-[#b48a78] scale-125' 
                            : 'bg-[#b48a78]/30 hover:bg-[#b48a78]/50'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Desktop navigation arrows */}
                <button
                  onClick={navigateToNextCategory}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-[#b48a78]/10 hover:bg-[#b48a78]/20 transition-all duration-200 hover:scale-110"
                  disabled={isTransitioning}
                >
                  <svg className="w-4 h-4 text-[#b48a78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            {isSearching && (
              <p className="text-[#b48a78]/70 font-medium text-sm md:text-base">
                {filteredProducts.length} produk ditemukan untuk "{search}"
              </p>
            )}
            <div className="w-16 h-1 bg-gradient-to-r from-[#b48a78] to-[#d4a574] mx-auto rounded-full mt-2 md:w-20 md:mt-3" />
          </div>
          
          {/* Loading State */}
          {isLoadingProducts ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 transition-all duration-300 ${
              isTransitioning 
                ? swipeDirection === 'left' 
                  ? 'transform -translate-x-4 opacity-70' 
                  : 'transform translate-x-4 opacity-70'
                : 'transform translate-x-0 opacity-100'
            }`}>
              {filteredProducts.slice(0, visibleCount).length === 0 ? (
                <div className="col-span-full text-center py-12 md:py-16">
                  <div className="w-20 h-20 mx-auto mb-4 bg-[#b48a78]/10 rounded-full flex items-center justify-center md:w-24 md:h-24">
                    <svg className="w-10 h-10 text-[#b48a78]/60 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.824-2.562M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#b48a78] mb-2 font-brand md:text-xl">
                    Tidak ada produk ditemukan
                  </h3>
                  <p className="text-[#b48a78]/70 text-sm md:text-base">
                    Coba kata kunci lain atau jelajahi kategori yang berbeda
                  </p>
                </div>
              ) : (
                filteredProducts.slice(0, visibleCount).map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group block touch-manipulation"
                    prefetch={false}
                  >
                    <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border-2 border-transparent shadow-lg hover:shadow-xl transition-all duration-300 relative md:hover:scale-[1.02] md:hover:-translate-y-1 active:scale-95 md:active:scale-100 flex flex-col h-full">
                      {/* Premium Border Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#b48a78]/20 via-transparent to-[#d4a574]/20 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
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
                        
                        {/* Enhanced Product Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 md:top-3 md:left-3 md:gap-2">
                          <ProductBadge type="ready" />
                          {product.is_popular && <ProductBadge type="popular" />}
                          {product.is_new && <ProductBadge type="new" />}
                          {product.is_promo && <ProductBadge type="promo" />}
                          {product.stock_count && product.stock_count < 10 && (
                            <ProductBadge type="stock" text={`${product.stock_count} tersisa`} />
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
                      <div className="p-3 md:p-5 relative flex flex-col flex-1">
                        {/* Premium Bottom Border */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-300" />
                        
                        <h3 className="font-bold text-[#b48a78] mb-2 line-clamp-2 font-brand text-xs leading-tight md:text-base md:leading-normal group-hover:text-[#8b6f47] transition-colors min-h-[2.5rem] md:min-h-[3rem]">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2 md:mb-3 mt-auto">
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
                          onClick={(e) => {
                            handleQuickAddToCart(product, e);
                          }}
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
                ))
              )}
            </div>
          )}
          
          {/* Infinite scroll loader */}
          {!isLoadingProducts && visibleCount < filteredProducts.length && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-6 md:py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#b48a78] border-t-transparent md:h-8 md:w-8"></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
