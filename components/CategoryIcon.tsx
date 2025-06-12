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

  // Debug logging - re-enabled to diagnose issue
  useEffect(() => {
    console.log(`CategoryIcon for "${categoryName}":`, {
      iconUrl: iconUrl ? `${iconUrl.substring(0, 50)}...` : 'No iconUrl',
      isBase64: iconUrl?.startsWith('data:image/'),
      priority,
      imageLoaded,
      imageError
    });
  }, [iconUrl, categoryName, priority, imageLoaded, imageError]);

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

  // Reset loading states when iconUrl changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [iconUrl]);

  // Determine if we should use Next.js Image optimization
  const shouldUseNextImage = iconUrl && !iconUrl.startsWith('data:image/');

  return (
    <div className="flex flex-col items-center snap-start min-w-[72px] pt-2 category-item">
      <button
        onClick={onClick}
        className={`relative group ${sizeConfig.classes[size]} flex items-center justify-center mb-1 transition-all duration-300 ${
          isSelected ? 'scale-110 transform' : 'hover:scale-105'
        }`}
      >
        {iconUrl && !imageError ? (
          <div className={`${sizeConfig.classes[size]}`}>
            {/* Loading skeleton - temporarily disabled */}
            {false && !imageLoaded && (
              <div className={`absolute inset-0 bg-[#b48a78]/10 rounded-2xl animate-pulse flex items-center justify-center z-10`}>
                <span className="text-sm text-[#b48a78]/50">📷</span>
              </div>
            )}
            
            {/* Ultra-simplified image rendering - just show the damn image */}
            <img 
              src={iconUrl} 
              alt={categoryName} 
              className={`rounded-2xl object-cover ${sizeConfig.classes[size]}`}
              onLoad={() => {
                setImageLoaded(true);
                console.log(`✅ Image loaded for ${categoryName}`);
              }}
              onError={(e) => {
                setImageError(true);
                console.error(`❌ Failed to load image for ${categoryName}:`, e);
              }}
            />
          </div>
        ) : (
          // Fallback icon with better styling
          <div className={`${sizeConfig.classes[size]} bg-gradient-to-br from-[#b48a78]/10 to-[#d4a574]/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#b48a78]/20`}>
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