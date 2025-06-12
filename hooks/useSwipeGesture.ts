import { useRef, useState } from 'react';
import { TouchEvent } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
    maxSwipeTime = 300
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    // Prevent default scrolling during horizontal swipes
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // If horizontal movement is greater than vertical, prevent default
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if it's a valid swipe
    const isValidSwipe = 
      Math.abs(deltaX) >= minSwipeDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) && // More horizontal than vertical
      deltaTime <= maxSwipeTime;

    if (isValidSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
    setIsSwipeActive(false);
  };

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    swipeHandlers,
    isSwipeActive
  };
}; 