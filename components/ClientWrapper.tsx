"use client";
import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Ensure minimum loading time for good UX
    const minLoadTime = setTimeout(() => {
      // Additional check for actual page readiness
      if (document.readyState === 'complete') {
        handleLoadingComplete();
      } else {
        const handleLoad = () => {
          handleLoadingComplete();
          window.removeEventListener('load', handleLoad);
        };
        window.addEventListener('load', handleLoad);
      }
    }, 1500); // Minimum 1.5 seconds loading time

    return () => {
      clearTimeout(minLoadTime);
    };
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Fade out the loading screen
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  return (
    <>
      {isVisible && (
        <div className={`transition-opacity duration-400 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
          <LoadingScreen onComplete={handleLoadingComplete} />
        </div>
      )}
      <div className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </>
  );
} 