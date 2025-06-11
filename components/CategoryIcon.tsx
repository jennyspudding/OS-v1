"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface CategoryIconProps {
  iconUrl?: string;
  categoryName: string;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryIcon({ 
  iconUrl, 
  categoryName, 
  isSelected = false, 
  onClick,
  size = 'md' 
}: CategoryIconProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Optimized loading for both base64 data URLs (admin-uploaded) and external URLs
  useEffect(() => {
    if (iconUrl && !imageError && !imageLoaded) {
      // If it's a base64 data URL (admin-uploaded icon), it loads instantly
      if (iconUrl.startsWith('data:image/')) {
        setImageLoaded(true);
        return;
      }
      
      // For external URLs, preload for faster display
      const img = new window.Image();
      img.src = iconUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
    }
  }, [iconUrl, imageError, imageLoaded]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14 md:w-16 md:h-16',
    lg: 'w-16 h-16 md:w-20 md:h-20'
  };

  const iconSize = {
    sm: { width: 48, height: 48 },
    md: { width: 56, height: 56 },
    lg: { width: 64, height: 64 }
  };

  return (
    <div className="flex flex-col items-center snap-start min-w-[72px] pt-2">
      <button
        onClick={onClick}
        className={`relative group ${sizeClasses[size]} flex items-center justify-center mb-1 transition-all duration-200 ${
          isSelected ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        {iconUrl && !imageError ? (
          <div className={`category-icon-container ${sizeClasses[size]}`}>
            <Image 
              src={iconUrl} 
              alt={categoryName} 
              width={iconSize[size].width} 
              height={iconSize[size].height}
              className={`rounded-2xl object-cover ${sizeClasses[size]} ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-200`}
              loading={iconUrl.startsWith('data:image/') ? "eager" : "lazy"}
              quality={iconUrl.startsWith('data:image/') ? 100 : 75}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRhwAAABXRUJQVlA4TBAAAAAvoAAAAEYoAABE///+A0A="
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              sizes="(max-width: 768px) 56px, 64px"
              unoptimized={iconUrl.startsWith('data:image/')}
            />
          </div>
        ) : (
          <div className={`${sizeClasses[size]} bg-[#b48a78]/10 rounded-2xl flex items-center justify-center`}>
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