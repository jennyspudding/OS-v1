"use client";

import { useEffect } from 'react';

interface PerformanceMetrics {
  iconUrl: string;
  loadTime: number;
  isBase64: boolean;
  priority: boolean;
}

export default function CategoryIconPerformanceMonitor() {
  useEffect(() => {
    // Monitor category icon loading performance
    const performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.name.includes('category') || entry.name.includes('icon')) {
          console.log(`[Category Icon Performance] ${entry.name}: ${entry.duration}ms`);
          
          // Track metrics for optimization
          const metrics: PerformanceMetrics = {
            iconUrl: entry.name,
            loadTime: entry.duration,
            isBase64: entry.name.startsWith('data:image/'),
            priority: entry.name.includes('priority')
          };
          
          // Log performance insights
          if (metrics.loadTime > 100 && !metrics.isBase64) {
            console.warn(`[Category Icon] Slow loading icon detected: ${metrics.iconUrl} (${metrics.loadTime}ms)`);
          }
          
          if (metrics.isBase64 && metrics.loadTime > 10) {
            console.warn(`[Category Icon] Base64 icon loading slower than expected: ${metrics.loadTime}ms`);
          }
        }
      });
    });
    
    // Observe resource loading
    performanceObserver.observe({ entryTypes: ['resource', 'navigation', 'measure'] });
    
    // Monitor image loading specifically
    const imageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.querySelectorAll('img[src*="category"], img[alt*="category"]');
            
            images.forEach((img) => {
              const imageElement = img as HTMLImageElement;
              const startTime = performance.now();
              
              imageElement.addEventListener('load', () => {
                const loadTime = performance.now() - startTime;
                console.log(`[Category Icon Load] ${imageElement.src}: ${loadTime.toFixed(2)}ms`);
                
                // Mark successful loads
                performance.mark(`category-icon-loaded-${Date.now()}`);
              });
              
              imageElement.addEventListener('error', () => {
                const loadTime = performance.now() - startTime;
                console.error(`[Category Icon Error] ${imageElement.src}: Failed after ${loadTime.toFixed(2)}ms`);
              });
            });
          }
        });
      });
    });
    
    // Start observing DOM changes
    imageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup
    return () => {
      performanceObserver.disconnect();
      imageObserver.disconnect();
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}

// Utility function to measure category icon performance
export const measureCategoryIconPerformance = (iconUrl: string, isBase64: boolean, priority: boolean) => {
  const startMark = `category-icon-start-${Date.now()}`;
  const endMark = `category-icon-end-${Date.now()}`;
  const measureName = `category-icon-measure-${Date.now()}`;
  
  performance.mark(startMark);
  
  return {
    finish: () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      const metrics: PerformanceMetrics = {
        iconUrl,
        loadTime: measure.duration,
        isBase64,
        priority
      };
      
      // Log performance data
      console.log(`[Category Icon Metrics]`, metrics);
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
      
      return metrics;
    }
  };
}; 