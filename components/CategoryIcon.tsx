"use client";

import Image from 'next/image';
import { useState } from 'react';

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
              } transition-opacity duration-300`}
              loading="eager"
              priority
              quality={75}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              sizes="(max-width: 768px) 56px, 64px"
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