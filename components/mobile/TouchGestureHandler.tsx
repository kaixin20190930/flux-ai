'use client';

import { useEffect, useRef } from 'react';

interface TouchGestureHandlerProps {
  elementRef: React.RefObject<HTMLElement>;
  onPinch?: (scale: number, centerX: number, centerY: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  enabled?: boolean;
}

/**
 * A React hook that adds touch gesture support to an element
 */
const useTouchGestures = ({
  elementRef,
  onPinch,
  onPan,
  onTap,
  onDoubleTap,
  onSwipe,
  enabled = true
}: TouchGestureHandlerProps) => {
  // Store touch state
  const touchStateRef = useRef({
    startTouches: [] as Touch[],
    lastTouches: [] as Touch[],
    startTime: 0,
    lastTapTime: 0,
    lastTapPosition: { x: 0, y: 0 },
    isPanning: false,
    isPinching: false,
    initialDistance: 0,
    initialAngle: 0,
    lastPanPosition: { x: 0, y: 0 }
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleTouchStart = (event: TouchEvent) => {
      const touches = Array.from(event.touches);
      const state = touchStateRef.current;
      
      state.startTouches = touches;
      state.lastTouches = touches;
      state.startTime = Date.now();
      
      if (touches.length === 1) {
        // Potential pan or tap
        state.isPanning = true;
        state.lastPanPosition = { 
          x: touches[0].clientX, 
          y: touches[0].clientY 
        };
      } else if (touches.length === 2) {
        // Potential pinch
        state.isPinching = true;
        state.initialDistance = getDistance(touches[0], touches[1]);
        state.initialAngle = getAngle(touches[0], touches[1]);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling while handling gestures
      const touches = Array.from(event.touches);
      const state = touchStateRef.current;
      
      if (state.isPanning && touches.length === 1) {
        // Handle pan
        const deltaX = touches[0].clientX - state.lastPanPosition.x;
        const deltaY = touches[0].clientY - state.lastPanPosition.y;
        
        if (onPan && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
          onPan(deltaX, deltaY);
        }
        
        state.lastPanPosition = { 
          x: touches[0].clientX, 
          y: touches[0].clientY 
        };
      } else if (state.isPinching && touches.length === 2) {
        // Handle pinch
        const currentDistance = getDistance(touches[0], touches[1]);
        const scale = currentDistance / state.initialDistance;
        
        if (onPinch) {
          const centerX = (touches[0].clientX + touches[1].clientX) / 2;
          const centerY = (touches[0].clientY + touches[1].clientY) / 2;
          onPinch(scale, centerX, centerY);
        }
      }
      
      state.lastTouches = touches;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const state = touchStateRef.current;
      const endTime = Date.now();
      const touchDuration = endTime - state.startTime;
      
      // Handle tap and double tap
      if (state.startTouches.length === 1 && 
          state.lastTouches.length === 0 && 
          touchDuration < 300) {
        
        const touch = state.startTouches[0];
        
        // Check for double tap
        if (endTime - state.lastTapTime < 300 && 
            Math.abs(touch.clientX - state.lastTapPosition.x) < 30 && 
            Math.abs(touch.clientY - state.lastTapPosition.y) < 30) {
          
          if (onDoubleTap) {
            onDoubleTap(touch.clientX, touch.clientY);
          }
          
          // Reset tap tracking
          state.lastTapTime = 0;
        } else {
          // Single tap
          if (onTap) {
            onTap(touch.clientX, touch.clientY);
          }
          
          // Track for potential double tap
          state.lastTapTime = endTime;
          state.lastTapPosition = { x: touch.clientX, y: touch.clientY };
        }
      }
      
      // Handle swipe
      if (state.startTouches.length === 1 && touchDuration < 300 && onSwipe) {
        const touch = state.startTouches[0];
        const lastTouch = state.lastTouches[0] || touch;
        
        const deltaX = lastTouch.clientX - touch.clientX;
        const deltaY = lastTouch.clientY - touch.clientY;
        
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / touchDuration;
        
        // Detect swipe direction if movement is significant
        if (velocity > 0.3) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            onSwipe(deltaX > 0 ? 'right' : 'left', velocity);
          } else {
            // Vertical swipe
            onSwipe(deltaY > 0 ? 'down' : 'up', velocity);
          }
        }
      }
      
      // Reset state
      state.isPanning = false;
      state.isPinching = false;
      state.startTouches = [];
      state.lastTouches = Array.from(event.touches);
    };

    // Helper functions
    function getDistance(touch1: Touch, touch2: Touch): number {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getAngle(touch1: Touch, touch2: Touch): number {
      return Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef, onPinch, onPan, onTap, onDoubleTap, onSwipe, enabled]);
};

export default useTouchGestures;