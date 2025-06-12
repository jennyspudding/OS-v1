/**
 * Icon Optimization Utility
 * Compresses and optimizes images before storing in database
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  enableProgressive?: boolean;
}

export const DEFAULT_ICON_OPTIONS: OptimizationOptions = {
  maxWidth: 64,
  maxHeight: 64,
  quality: 0.8,
  format: 'webp',
  enableProgressive: true,
};

/**
 * Optimizes an image file for category icons
 */
export const optimizeIconImage = async (
  file: File,
  options: OptimizationOptions = DEFAULT_ICON_OPTIONS
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        const { maxWidth = 64, maxHeight = 64, quality = 0.8, format = 'webp' } = options;
        
        // Calculate optimal dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth || height > maxHeight) {
          if (aspectRatio > 1) {
            // Landscape
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            // Portrait or square
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let result: string;
        if (format === 'webp') {
          result = canvas.toDataURL('image/webp', quality);
          // Check if WebP is supported
          if (!result.startsWith('data:image/webp')) {
            result = canvas.toDataURL('image/jpeg', quality);
          }
        } else if (format === 'jpeg') {
          result = canvas.toDataURL('image/jpeg', quality);
        } else {
          result = canvas.toDataURL('image/png', quality);
        }

        // Verify compression was effective
        const originalSize = file.size;
        const compressedSize = Math.round((result.length * 3) / 4); // Approximate base64 size
        
        console.log(`Icon optimized: ${originalSize} bytes → ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Cleanup
    const originalOnLoad = img.onload;
    img.onload = (event) => {
      URL.revokeObjectURL(objectUrl);
      if (originalOnLoad) {
        originalOnLoad.call(img, event);
      }
    };
  });
};

/**
 * Batch optimize multiple icons
 */
export const batchOptimizeIcons = async (
  files: File[],
  options: OptimizationOptions = DEFAULT_ICON_OPTIONS
): Promise<string[]> => {
  const promises = files.map(file => optimizeIconImage(file, options));
  return Promise.all(promises);
};

/**
 * Get optimal icon size based on usage context
 */
export const getOptimalIconOptions = (context: 'category' | 'product' | 'banner'): OptimizationOptions => {
  switch (context) {
    case 'category':
      return {
        maxWidth: 64,
        maxHeight: 64,
        quality: 0.8,
        format: 'webp',
        enableProgressive: true,
      };
    case 'product':
      return {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.85,
        format: 'webp',
        enableProgressive: true,
      };
    case 'banner':
      return {
        maxWidth: 800,
        maxHeight: 400,
        quality: 0.9,
        format: 'webp',
        enableProgressive: true,
      };
    default:
      return DEFAULT_ICON_OPTIONS;
  }
};

/**
 * Validate image file before optimization
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Please use an image smaller than 5MB.' };
  }

  return { valid: true };
}; 