'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleOAuthProviderProps {
  children: ReactNode;
}

/**
 * Google OAuth Provider 组件
 * 
 * 用途：
 * - 为整个应用提供 Google OAuth 上下文
 * - 配置 Google Client ID
 * - 支持 Google 登录功能
 * 
 * 使用方式：
 * 在根布局中包裹所有子组件
 */
export function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // 如果没有配置 Google Client ID，显示警告但不阻止应用运行
  if (!clientId) {
    console.warn('⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID 未配置，Google OAuth 功能将不可用');
    return <>{children}</>;
  }

  return (
    <GoogleProvider clientId={clientId}>
      {children}
    </GoogleProvider>
  );
}
