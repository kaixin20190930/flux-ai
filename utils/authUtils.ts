import {User} from "@/utils/userUtils";

/**
 * Client-side utility to get user data from localStorage.
 * This is kept for backward compatibility with client-side code.
 * 
 * Note: For server-side authentication, use NextAuth utilities from lib/auth-utils.ts
 * 
 * @returns User object from localStorage or null
 */
export async function getUserFromLocalStorage() {
    if (typeof window === 'undefined') {
        return null; // If running on server-side, return null
    }

    const userString = localStorage.getItem('user');
    if (!userString)
        return null;
    try {
        const user: User = JSON.parse(userString);
        return user;
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
    }
}


// ==================== 兼容层函数 ====================
// 这些函数用于支持旧的 API，应该逐步迁移到 NextAuth

import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * 从请求中获取用户信息（使用 NextAuth）
 * @deprecated 使用 auth() 替代
 */
export async function getUserFromRequest(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  
  return {
    userId: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    points: 0, // 需要从数据库查询
    subscription_type: null,
    subscription_start_date: null,
    subscription_end_date: null,
  };
}

/**
 * 从 Cookie 中获取用户信息
 * @deprecated 使用 auth() 替代
 */
export async function getUserFromCookie(request: NextRequest, jwtSecret: string) {
  // 使用 NextAuth session
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  
  return {
    userId: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    points: 0,
    subscription_type: null,
    subscription_start_date: null,
    subscription_end_date: null,
  };
}

/**
 * 验证管理员权限
 * @deprecated 使用 auth() 并检查 user.role 替代
 */
export async function verifyAdminAccess(sessionToken: string): Promise<boolean> {
  const session = await auth();
  
  // 简单实现：检查用户是否存在
  // TODO: 添加实际的管理员角色检查
  return !!session?.user;
}
