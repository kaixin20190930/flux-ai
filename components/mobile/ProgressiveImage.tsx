'use client';

import React, { useState, useEffect } from 'react';
import { 
  detectNetworkConnection, 
  getNetworkAwareImageQuality, 
  getOptimizedImageDimensions,
  getProgressiveImageUrl,
  createLowQualityPlaceholder
} from '@/utils/mobileOptimization';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholderColor?: string;
  onLoad?: () => void;
}

/**
 * A component that implements progressive image loading for better mobile experience
 * It shows a low-quality placeholder while the full image loads
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  placeholderColor = '#1a1a1a',
  onLoad
}) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [networkType, setNetworkType] = useState<string>('unknown');

  // Generate optimized image URL based on network conditions
  useEffect(() => {
    const connection = detectNetworkConnection();
    setNetworkType(connection);
    
    // Skip optimization for data URLs
    if (src.startsWith('data:')) {
      setOptimizedSrc(src);
      return;
    }
    
    // Get quality based on network
    const quality = getNetworkAwareImageQuality();
    
    // Get dimensions based on original size and network
    const dimensions = width && height 
      ? getOptimizedImageDimensions(width, height)
      : undefined;
    
    // Create optimized URL
    const optimized = getProgressiveImageUrl(src, {
      quality,
      width: dimensions?.width,
      height: dimensions?.height,
      format: 'webp' // Use WebP for better compression if supported
    });
    
    setOptimizedSrc(optimized);
    
    // Generate low-quality placeholder
    const generatePlaceholder = async () => {
      try {
        // Only generate placeholder for slow connections
        if (['slow-2g', '2g', '3g'].includes(connection)) {
          const placeholderUrl = await createLowQualityPlaceholder(src);
          setPlaceholder(placeholderUrl);
        }
      } catch (error) {
        console.warn('Failed to create image placeholder:', error);
      }
    };
    
    generatePlaceholder();
  }, [src, width, height]);

  // Handle image load
  const handleImageLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: placeholderColor,
        ...style
      }}
    >
      {/* Low quality placeholder */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          style={{ filter: 'blur(8px)' }}
        />
      )}
      
      {/* Main image with optimized source */}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
      
      {/* Loading indicator for slow connections */}
      {!loaded && ['slow-2g', '2g'].includes(networkType) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;