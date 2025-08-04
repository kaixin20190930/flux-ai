/**
 * Mobile optimization utilities for image loading and network detection
 */

// Network connection types
export type NetworkConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

/**
 * Detect the current network connection type
 * @returns The detected network connection type
 */
export const detectNetworkConnection = (): NetworkConnectionType => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  // @ts-ignore - Navigator connection API is not in TypeScript defs yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return 'unknown';
  }

  // Use effectiveType if available (modern browsers)
  if (connection.effectiveType) {
    return connection.effectiveType as NetworkConnectionType;
  }

  // Fallback to type (older spec)
  if (connection.type) {
    switch (connection.type) {
      case 'cellular':
        return '3g'; // Assume 3G for cellular
      case 'wifi':
      case 'ethernet':
        return '4g'; // Assume fast for WiFi/ethernet
      default:
        return 'unknown';
    }
  }

  return 'unknown';
};

/**
 * Get the appropriate image quality based on network connection
 * @returns Image quality (0-100)
 */
export const getNetworkAwareImageQuality = (): number => {
  const connectionType = detectNetworkConnection();
  
  switch (connectionType) {
    case 'slow-2g':
      return 30;
    case '2g':
      return 50;
    case '3g':
      return 70;
    case '4g':
    default:
      return 90;
  }
};

/**
 * Get the appropriate image size based on network connection and screen size
 * @param originalWidth Original image width
 * @param originalHeight Original image height
 * @returns Optimized dimensions
 */
export const getOptimizedImageDimensions = (
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } => {
  const connectionType = detectNetworkConnection();
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  // Calculate the maximum dimensions based on screen size
  const maxWidth = Math.min(screenWidth, originalWidth);
  const maxHeight = Math.min(screenHeight, originalHeight);
  
  // Apply network-based scaling factor
  let scaleFactor = 1;
  switch (connectionType) {
    case 'slow-2g':
      scaleFactor = 0.3;
      break;
    case '2g':
      scaleFactor = 0.5;
      break;
    case '3g':
      scaleFactor = 0.7;
      break;
    case '4g':
    default:
      scaleFactor = 1;
      break;
  }
  
  return {
    width: Math.round(maxWidth * scaleFactor),
    height: Math.round(maxHeight * scaleFactor)
  };
};

/**
 * Create a progressive image loading URL
 * @param imageUrl Original image URL
 * @param options Options for progressive loading
 * @returns URL with progressive loading parameters
 */
export const getProgressiveImageUrl = (
  imageUrl: string,
  options: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string => {
  // If the URL is already a data URL or doesn't support query parameters, return as is
  if (imageUrl.startsWith('data:') || !imageUrl.includes('://')) {
    return imageUrl;
  }
  
  try {
    const url = new URL(imageUrl);
    
    // Set quality parameter if provided
    if (options.quality !== undefined) {
      url.searchParams.set('q', options.quality.toString());
    }
    
    // Set width parameter if provided
    if (options.width !== undefined) {
      url.searchParams.set('w', options.width.toString());
    }
    
    // Set height parameter if provided
    if (options.height !== undefined) {
      url.searchParams.set('h', options.height.toString());
    }
    
    // Set format parameter if provided
    if (options.format !== undefined) {
      url.searchParams.set('fm', options.format);
    }
    
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to create progressive image URL:', error);
    return imageUrl;
  }
};

/**
 * Monitor network status changes
 * @param callback Function to call when network status changes
 * @returns Cleanup function
 */
export const monitorNetworkChanges = (
  callback: (connectionType: NetworkConnectionType) => void
): (() => void) => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return () => {};
  }
  
  // @ts-ignore - Navigator connection API is not in TypeScript defs yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return () => {};
  }
  
  const handleChange = () => {
    callback(detectNetworkConnection());
  };
  
  connection.addEventListener('change', handleChange);
  
  return () => {
    connection.removeEventListener('change', handleChange);
  };
};

/**
 * Check if the device is on a metered connection (user pays for data)
 * @returns Boolean indicating if connection is metered
 */
export const isMeteredConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  // @ts-ignore - Navigator connection API is not in TypeScript defs yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection || typeof connection.saveData !== 'boolean') {
    return false;
  }
  
  return connection.saveData;
};

/**
 * Create a low-quality image placeholder
 * @param imageUrl Original image URL
 * @returns Promise resolving to a data URL for the placeholder
 */
export const createLowQualityPlaceholder = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create a small canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size to a small thumbnail
        const width = 20;
        const height = Math.round((img.height / img.width) * width);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image at a small size
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the data URL
        const placeholderUrl = canvas.toDataURL('image/jpeg', 0.1);
        resolve(placeholderUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for placeholder'));
    };
    
    img.src = imageUrl;
  });
};