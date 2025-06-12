"use client";

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';

interface CategoryIconProps {
  iconUrl?: string;
  categoryName: string;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

export default function CategoryIcon({ 
  iconUrl, 
  categoryName, 
  isSelected = false, 
  onClick,
  size = 'md',
  priority = false
}: CategoryIconProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize size configurations to prevent re-calculations
  const sizeConfig = useMemo(() => ({
    classes: {
      sm: 'w-12 h-12',
      md: 'w-14 h-14 md:w-16 md:h-16',
      lg: 'w-16 h-16 md:w-20 md:h-20'
    },
    dimensions: {
      sm: { width: 48, height: 48 },
      md: { width: 56, height: 56 },
      lg: { width: 64, height: 64 }
    }
  }), []);

  // Enhanced loading optimization
  useEffect(() => {
    if (!iconUrl || imageError || imageLoaded) return;

    // Base64 data URLs load instantly
    if (iconUrl.startsWith('data:image/')) {
      setImageLoaded(true);
      return;
    }
    
    // For external URLs, use more aggressive preloading
    const img = new window.Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for better caching
    img.decoding = 'async'; // Async decoding for better performance
    img.loading = priority ? 'eager' : 'lazy';
    
    img.onload = () => {
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(true);
    };
    
    // Start loading immediately
    img.src = iconUrl;
    
    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [iconUrl, imageError, imageLoaded, priority]);

  // Determine loading strategy based on icon type and priority
  const loadingStrategy = useMemo(() => {
    if (!iconUrl) return null;
    
    const isBase64 = iconUrl.startsWith('data:image/');
    return {
      loading: (isBase64 || priority) ? "eager" : "lazy",
      quality: isBase64 ? 100 : 75,
      unoptimized: isBase64,
      priority: priority || isBase64
    };
  }, [iconUrl, priority]);

  return (
    <div className="flex flex-col items-center snap-start min-w-[72px] pt-2">
      <button
        onClick={onClick}
        className={`relative group ${sizeConfig.classes[size]} flex items-center justify-center mb-1 transition-all duration-200 ${
          isSelected ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        {iconUrl && !imageError && loadingStrategy ? (
          <div className={`category-icon-container ${sizeConfig.classes[size]} ${priority ? 'priority' : ''}`}>
            <Image 
              src={iconUrl} 
              alt={categoryName} 
              width={sizeConfig.dimensions[size].width} 
              height={sizeConfig.dimensions[size].height}
              className={`rounded-2xl object-cover ${sizeConfig.classes[size]} ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-200`}
              loading={loadingStrategy.loading as "eager" | "lazy"}
              quality={loadingStrategy.quality}
              priority={loadingStrategy.priority}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRhwAAABXRUJQVlA4TBAAAAAvoAAAAEYoAABE///+A0A="
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              sizes="(max-width: 768px) 56px, 64px"
              unoptimized={loadingStrategy.unoptimized}
            />
          </div>
        ) : (
          <div className={`${sizeConfig.classes[size]} bg-[#b48a78]/10 rounded-2xl flex items-center justify-center`}>
            <span className="text-xl md:text-2xl">🍮</span>
          </div>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full"></div>
        )}
      </button>
      
      <span className={`text-xs font-medium text-center font-brand max-w-[72px] leading-tight md:text-sm transition-colors duration-200 ${
        isSelected ? 'text-[#8b5a3c] font-bold' : 'text-[#b48a78]'
      }`}>
        {categoryName}
      </span>
    </div>
  );
} 