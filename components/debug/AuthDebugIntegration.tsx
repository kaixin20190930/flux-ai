'use client';

import React from 'react';
import { AuthDebugTrigger } from './AuthDebugTrigger';
import { useAuthStateMonitor, useAuthConsistencyChecker } from '../../hooks/useAuthDebug';

interface AuthDebugIntegrationProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  consistencyCheckInterval?: number;
}

/**
 * Integration component that adds authentication debugging capabilities
 * to the application. Only active in development environment.
 */
export const AuthDebugIntegration: React.FC<AuthDebugIntegrationProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  consistencyCheckInterval = 5000
}) => {
  // Monitor authentication state changes
  useAuthStateMonitor();
  
  // Automatically check for consistency issues
  useAuthConsistencyChecker(consistencyCheckInterval);

  if (!enabled) {
    return null;
  }

  return (
    <AuthDebugTrigger 
      position={position}
      showInProduction={false}
    />
  );
};