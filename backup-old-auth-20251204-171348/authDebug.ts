// 认证调试工具
import { User } from '@/utils/userUtils';

export function logAuthDebugInfo() {
  if (typeof window === 'undefined') return;

  console.group('🔐 Auth Debug Info');
  
  // 检查localStorage
  const userString = localStorage.getItem('user');
  const hasLocalUser = !!userString;
  let localUser: User | null = null;
  
  if (userString) {
    try {
      localUser = JSON.parse(userString);
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
    }
  }
  
  // 检查cookie
  const tokenMatch = document.cookie.match(/token=([^;]+)/);
  const hasToken = !!tokenMatch;
  const token = tokenMatch ? tokenMatch[1] : null;
  
  // 检查认证状态同步
  const isSync = hasLocalUser === hasToken;
  
  console.log('📱 Local Storage:', {
    hasUser: hasLocalUser,
    user: localUser,
    userString
  });
  
  console.log('🍪 Cookie:', {
    hasToken,
    token: token ? `${token.substring(0, 10)}...` : null,
    allCookies: document.cookie
  });
  
  console.log('🔄 Sync Status:', {
    isSync,
    hasLocalUser,
    hasToken
  });
  
  // 检查当前URL
  console.log('🌐 Current URL:', window.location.href);
  
  console.groupEnd();
}

export function checkAuthConsistency(): {
  isConsistent: boolean;
  issues: string[];
  recommendations: string[];
} {
  if (typeof window === 'undefined') {
    return { isConsistent: true, issues: [], recommendations: [] };
  }

  const issues: string[] = [];
  const recommendations: string[] = [];

  // 检查localStorage
  const userString = localStorage.getItem('user');
  const hasLocalUser = !!userString;
  let localUser: User | null = null;
  
  if (userString) {
    try {
      localUser = JSON.parse(userString);
    } catch (error) {
      issues.push('Invalid user data in localStorage');
      recommendations.push('Clear localStorage and re-login');
    }
  }

  // 检查cookie
  const tokenMatch = document.cookie.match(/token=([^;]+)/);
  const hasToken = !!tokenMatch;

  // 检查同步状态
  if (hasLocalUser && !hasToken) {
    issues.push('User data exists but no token found');
    recommendations.push('Clear localStorage or re-login');
  }

  if (!hasLocalUser && hasToken) {
    issues.push('Token exists but no user data found');
    recommendations.push('Clear cookie or re-login');
  }

  if (!hasLocalUser && !hasToken) {
    // 这是正常状态，用户未登录
  }

  if (hasLocalUser && hasToken && localUser) {
    // 检查用户数据完整性
    if (!localUser.userId) {
      issues.push('User data missing userId');
      recommendations.push('Re-login to refresh user data');
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    recommendations
  };
}

export function forceAuthSync() {
  if (typeof window === 'undefined') return;

  console.log('🔄 Forcing auth sync...');
  
  const { isConsistent, issues, recommendations } = checkAuthConsistency();
  
  if (!isConsistent) {
    console.warn('⚠️ Auth inconsistencies detected:', issues);
    console.log('💡 Recommendations:', recommendations);
    
    // 自动修复一些常见问题
    const userString = localStorage.getItem('user');
    const hasToken = document.cookie.includes('token=');
    
    if (userString && !hasToken) {
      console.log('🔧 Auto-fixing: Removing invalid user data');
      localStorage.removeItem('user');
    }
    
    if (!userString && hasToken) {
      console.log('🔧 Auto-fixing: Removing orphaned token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
  }
  
  // 触发认证状态变化事件
  const event = new CustomEvent('auth-state-changed');
  window.dispatchEvent(event);
  
  console.log('✅ Auth sync completed');
}