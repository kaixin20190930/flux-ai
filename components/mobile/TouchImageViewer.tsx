'use client';

import React, { useRef, useState, useEffect } from 'react';
import useTouchGestures from './TouchGestureHandler';

interface TouchImageViewerProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  onClose?: () => void;
}

/**
 * A component for viewing images with touch gestures on mobile devices
 * Supports pinch to zoom, pan, double tap to zoom, and swipe to dismiss
 */
const TouchImageViewer: React.FC<TouchImageViewerProps> = ({
  imageUrl,
  alt = 'Image',
  className = '',
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  
  // Reset position and scale when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setLoading(true);
  }, [imageUrl]);

  // Handle pinch gesture
  const handlePinch = (newScale: number, centerX: number, centerY: number) => {
    // Limit scale between 0.5 and 5
    const clampedScale = Math.min(Math.max(newScale, 0.5), 5);
    setScale(clampedScale);
  };

  // Handle pan gesture
  const handlePan = (deltaX: number, deltaY: number) => {
    if (scale > 1) {
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  };

  // Handle double tap gesture
  const handleDoubleTap = (x: number, y: number) => {
    if (scale > 1) {
      // Reset zoom
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      // Zoom in to 2x
      setScale(2);
    }
  };

  // Handle swipe gesture
  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => {
    if (scale === 1 && onClose && (direction === 'down' || direction === 'up') && velocity > 0.5) {
      onClose();
    }
  };

  // Apply touch gestures
  useTouchGestures({
    elementRef: containerRef,
    onPinch: handlePinch,
    onPan: handlePan,
    onDoubleTap: handleDoubleTap,
    onSwipe: handleSwipe
  });

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden touch-none ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-contain transition-opacity duration-300"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center',
          opacity: loading ? 0 : 1
        }}
        onLoad={() => setLoading(false)}
      />
      
      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {Math.round(scale * 100)}%
        </div>
      )}
      
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
      
      {/* Instructions hint - shown briefly */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-xs text-center opacity-0 animate-fade-out">
        双击放大 • 捏合缩放 • 上下滑动关闭
      </div>
    </div>
  );
};

export default TouchImageViewer;