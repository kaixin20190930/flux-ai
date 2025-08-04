'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { 
  detectNetworkConnection, 
  monitorNetworkChanges, 
  isMeteredConnection 
} from '@/utils/mobileOptimization';

interface NetworkStatusIndicatorProps {
  showAlways?: boolean;
  className?: string;
}

/**
 * A component that displays the current network status
 * and provides visual feedback for slow connections
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showAlways = false,
  className = ''
}) => {
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMetered, setIsMetered] = useState<boolean>(false);
  const [showIndicator, setShowIndicator] = useState<boolean>(false);

  useEffect(() => {
    // Initial detection
    setConnectionType(detectNetworkConnection());
    setIsOnline(navigator.onLine);
    setIsMetered(isMeteredConnection());
    
    // Show indicator for slow connections or if showAlways is true
    const shouldShow = showAlways || 
      ['slow-2g', '2g'].includes(detectNetworkConnection()) || 
      !navigator.onLine;
    
    setShowIndicator(shouldShow);
    
    // Monitor network changes
    const cleanup = monitorNetworkChanges((type) => {
      setConnectionType(type);
      setShowIndicator(showAlways || ['slow-2g', '2g'].includes(type) || !navigator.onLine);
    });
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionType(detectNetworkConnection());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Auto-hide indicator after 5 seconds if connection is good
    let hideTimeout: NodeJS.Timeout;
    if (!showAlways && isOnline && !['slow-2g', '2g'].includes(connectionType)) {
      hideTimeout = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);
    }
    
    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(hideTimeout);
    };
  }, [showAlways]);

  // Don't render anything if we shouldn't show the indicator
  if (!showIndicator) {
    return null;
  }

  // Get status information
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff size={16} />,
        text: '离线模式',
        color: 'bg-red-500'
      };
    }
    
    switch (connectionType) {
      case 'slow-2g':
        return {
          icon: <AlertTriangle size={16} />,
          text: '网络极慢',
          color: 'bg-red-500'
        };
      case '2g':
        return {
          icon: <AlertTriangle size={16} />,
          text: '网络较慢',
          color: 'bg-yellow-500'
        };
      case '3g':
        return {
          icon: <Wifi size={16} />,
          text: '网络一般',
          color: 'bg-yellow-400'
        };
      case '4g':
        return {
          icon: <Wifi size={16} />,
          text: '网络良好',
          color: 'bg-green-500'
        };
      default:
        return {
          icon: <Wifi size={16} />,
          text: '网络正常',
          color: 'bg-green-500'
        };
    }
  };

  const { icon, text, color } = getStatusInfo();

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 flex items-center px-3 py-1.5 rounded-full text-white text-sm shadow-lg ${color} ${className}`}
    >
      <span className="mr-1.5">{icon}</span>
      <span>{text}</span>
      {isMetered && (
        <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
          计费网络
        </span>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;