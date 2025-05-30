"use client";
import React from 'react';

interface ProductBadgeProps {
  type: 'ready' | 'popular' | 'new' | 'promo' | 'stock';
  text?: string;
  className?: string;
}

export default function ProductBadge({ type, text, className = "" }: ProductBadgeProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case 'ready':
        return {
          text: text || 'H+1 Ready',
          bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
          textColor: 'text-white',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          animation: 'animate-pulse'
        };
      case 'popular':
        return {
          text: text || 'Terlaris',
          bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
          textColor: 'text-white',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ),
          animation: ''
        };
      case 'new':
        return {
          text: text || 'Baru',
          bgColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
          textColor: 'text-white',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 2C13.1 2 14 2.9 14 4V8L15.5 9.5C15.9 9.9 15.9 10.4 15.5 10.8L10.8 15.5C10.4 15.9 9.9 15.9 9.5 15.5L4.8 10.8C4.4 10.4 4.4 9.9 4.8 9.5L6 8V4C6 2.9 6.9 2 8 2H12Z" clipRule="evenodd" />
            </svg>
          ),
          animation: 'animate-bounce'
        };
      case 'promo':
        return {
          text: text || 'Promo',
          bgColor: 'bg-gradient-to-r from-pink-500 to-red-500',
          textColor: 'text-white',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          ),
          animation: 'animate-pulse'
        };
      case 'stock':
        return {
          text: text || 'Stok Terbatas',
          bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          textColor: 'text-white',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          animation: 'animate-pulse'
        };
      default:
        return {
          text: text || 'Label',
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          icon: null,
          animation: ''
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div 
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-lg
        ${config.bgColor} ${config.textColor} ${config.animation} ${className}
        transform transition-all duration-200 hover:scale-105
      `}
    >
      {config.icon}
      {config.text}
    </div>
  );
} 