"use client";
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Show text after logo animation
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(textTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#ffe9ea] via-[#fef3f3] to-[#fff0f1]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(180,138,120,0.1)_0%,_transparent_50%),_radial-gradient(circle_at_75%_75%,_rgba(212,165,116,0.1)_0%,_transparent_50%)] pointer-events-none" />
      
      {/* Logo Container */}
      <div className="relative flex flex-col items-center animate-fadeInUp">
        {/* Pudding Character SVG */}
        <div className="relative mb-6 animate-bounce">
          {/* Character Base */}
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {/* Pudding Body */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-12 md:w-20 md:h-16 bg-gradient-to-b from-[#d4a574] to-[#b48a78] rounded-full shadow-lg" />
            
            {/* Pudding Top/Hat */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-16 md:w-24 md:h-20 bg-gradient-to-b from-[#f5e1d8] to-[#e9cfc0] rounded-t-full border-b-4 border-[#d4a574] shadow-md" />
            
            {/* Face */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-16 h-8 md:w-20 md:h-10">
              {/* Eyes */}
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-black rounded-full animate-blink" />
                <div className="w-2 h-2 bg-black rounded-full animate-blink" />
              </div>
              {/* Cheeks */}
              <div className="absolute -left-1 top-1 w-3 h-2 bg-pink-200 rounded-full opacity-60" />
              <div className="absolute -right-1 top-1 w-3 h-2 bg-pink-200 rounded-full opacity-60" />
            </div>
            
            {/* Cherry on top */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-b from-[#ff6b8a] to-[#e91e63] rounded-full animate-sway" />
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 translate-x-1 w-1 h-2 bg-green-500 rounded-sm" />
          </div>
        </div>

        {/* Brand Text */}
        <div className={`text-center transition-all duration-700 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#b48a78] to-[#d4a574] bg-clip-text text-transparent font-playfair mb-2">
            Jenny's Pudding
          </h1>
          <p className="text-sm md:text-base text-[#8b6f47] font-medium">
            Premium Artisanal Desserts
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="mt-8 w-48 md:w-64 h-1 bg-white/30 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading Text */}
        <div className="mt-4 text-xs md:text-sm text-[#8b6f47]/70 font-medium">
          Loading... {Math.round(progress)}%
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating hearts */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 text-pink-300 animate-float">♥</div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 text-pink-200 animate-float-delayed-1">♥</div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 text-pink-300 animate-float-delayed-2">♥</div>
        
        {/* Floating dots */}
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-[#d4a574]/30 rounded-full animate-float-delayed-3" />
        <div className="absolute bottom-1/4 right-1/6 w-1 h-1 bg-[#b48a78]/30 rounded-full animate-float-delayed-4" />
      </div>


    </div>
  );
} 