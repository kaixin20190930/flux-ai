// 认证状态同步工具
import { User } from '@/utils/userUtils';

/**
 * 同步认证状态到localStorage和cookie
 */
export function syncAuthState(user: User | null, token: string | null) {
  if (typeof window === 'undefined') return;

  if (user && token) {
    // 登录状态：同步用户信息和token
    localStorage.setItem('user', JSON.stringify(user));
    
    // 改进cookie设置，添加SameSite和Secure属性
    const isSecure = window.location.protocol === 'https:';
    const cookieOptions = [
      `token=${token}`,
      'path=/',
      `max-age=${7 * 24 * 60 * 60}`,
      'SameSite=Lax',
      'HttpOnly=false', // 需要JavaScript访问
      ...(isSecure ? ['Secure'] : [])
    ];
    document.cookie = cookieOptions.join('; ');
    
    console.log('Cookie set with options:', cookieOptions.join('; '));
  } else {
    // 登出状态：清除所有认证信息
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  }
  
  // 触发认证状态变化事件
  const event = new CustomEvent('auth-state-changed', {
    detail: { user, token, timestamp: Date.now() }
  });
  
  // 使用setTimeout确保事件在下一个事件循环中触发
  setTimeout(() => {
    window.dispatchEvent(event);
    console.log('Auth state change event dispatched:', { hasUser: !!user, hasToken: !!token });
  }, 0);
}

/**
 * 检查认证状态是否同步
 */
export function checkAuthSync(): { isSync: boolean; hasLocalUser: boolean; hasToken: boolean } {
  if (typeof window === 'undefined') {
    return { isSync: true, hasLocalUser: false, hasToken: false };
  }

  const hasLocalUser = !!localStorage.getItem('user');
  const hasToken = document.cookie.includes('token=');

  return {
    isSync: hasLocalUser === hasToken,
    hasLocalUser,
    hasToken,
  };
}

/**
 * 修复认证状态不同步的问题
 */
export function fixAuthSync() {
  if (typeof window === 'undefined') return;

  const { isSync, hasLocalUser, hasToken } = checkAuthSync();

  if (!isSync) {
    if (hasLocalUser && !hasToken) {
      // 有本地用户但没有token，清除本地用户
      console.warn('Auth sync fix: removing local user data (no token)');
      localStorage.removeItem('user');
    } else if (!hasLocalUser && hasToken) {
      // 有token但没有本地用户，清除token
      console.warn('Auth sync fix: removing token (no local user)');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
  }
}

/**
 * 获取当前认证状态
 */
export function getCurrentAuthState(): { user: User | null; hasToken: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, hasToken: false };
  }

  let user: User | null = null;
  const userString = localStorage.getItem('user');
  
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
    }
  }

  const hasToken = document.cookie.includes('token=');

  return { user, hasToken };
}