'use client';

import React, { ReactNode, useEffect, useState } from 'react';

interface MobileOptimizedProps {
  children: ReactNode;
  mobileContent?: ReactNode;
  breakpoint?: number;
}

/**
 * A component that renders different content based on screen size
 * This helps optimize the UI for mobile devices
 */
const MobileOptimized: React.FC<MobileOptimizedProps> = ({
  children,
  mobileContent,
  breakpoint = 768, // Default mobile breakpoint
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [breakpoint]);

  // During SSR or initial render, default to desktop view
  if (!isClient) {
    return <>{children}</>;
  }

  return <>{isMobile && mobileContent ? mobileContent : children}</>;
};

export default MobileOptimized;