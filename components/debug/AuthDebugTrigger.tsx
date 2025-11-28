'use client';

import React, { useState, useEffect } from 'react';
import { AuthDebugPanel } from './AuthDebugPanel';

interface AuthDebugTriggerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showInProduction?: boolean;
}

export const AuthDebugTrigger: React.FC<AuthDebugTriggerProps> = ({ 
  position = 'bottom-right',
  showInProduction = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development environment unless explicitly allowed in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    setIsVisible(isDevelopment || showInProduction);
  }, [showInProduction]);

  useEffect(() => {
    // Keyboard shortcut to toggle debug panel (Ctrl/Cmd + Shift + D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <>
      {/* Debug Trigger Button */}
      <div className={`fixed ${positionClasses[position]} z-40`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Open Auth Debug Panel (Ctrl/Cmd + Shift + D)"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" 
            />
          </svg>
        </button>
      </div>

      {/* Debug Panel */}
      <AuthDebugPanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};