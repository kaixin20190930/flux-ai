'use client'

import { useEffect } from 'react';
import { fixAuthSync } from '@/utils/authSync';

/**
 * 认证状态检查组件
 * 在应用启动时检查并修复认证状态不同步的问题
 */
export function AuthChecker() {
  useEffect(() => {
    // 检查并修复认证状态
    fixAuthSync();
  }, []);

  return null; // 这个组件不渲染任何内容
}