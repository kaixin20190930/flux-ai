// 增强的认证状态管理器
import { User } from '@/utils/userUtils';
import React from 'react';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  userPoints: number | null;
  loading: boolean;
  lastUpdated: number;
}

class AuthManager {
  private state: AuthState = {
    user: null,
    isLoggedIn: false,
    userPoints: null,
    loading: true,
    lastUpdated: 0
  };

  private listeners: Set<(state: AuthState) => void> = new Set();
  private apiCallInProgress = false;

  constructor() {
    // 初始化时从本地存储加载状态
    this.loadFromLocalStorage();
    
    // 监听存储变化（多标签页同步）
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      const userString = localStorage.getItem('user');
      const hasToken = document.cookie.includes('token=');
      
      if (userString && hasToken) {
        const user = JSON.parse(userString);
        this.state = {
          user,
          isLoggedIn: true,
          userPoints: null, // 将通过API获取
          loading: false,
          lastUpdated: Date.now()
        };
      } else {
        this.state = {
          user: null,
          isLoggedIn: false,
          userPoints: null,
          loading: false,
          lastUpdated: Date.now()
        };
      }
    } catch (error) {
      console.error('Error loading auth state from localStorage:', error);
      this.clearLocalStorage();
    }
  }

  private clearLocalStorage() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'user') {
      this.loadFromLocalStorage();
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // 订阅状态变化
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    
    // 立即调用一次以获取当前状态
    listener({ ...this.state });
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 获取当前状态
  getState(): AuthState {
    return { ...this.state };
  }

  // 更新认证状态
  updateState(newState: Partial<AuthState>) {
    const oldState = { ...this.state };
    this.state = {
      ...this.state,
      ...newState,
      lastUpdated: Date.now()
    };

    // 如果登录状态发生变化，记录日志
    if (oldState.isLoggedIn !== this.state.isLoggedIn) {
      console.log('Auth state changed:', {
        from: { isLoggedIn: oldState.isLoggedIn, user: !!oldState.user },
        to: { isLoggedIn: this.state.isLoggedIn, user: !!this.state.user }
      });
    }

    this.notifyListeners();
  }

  // 从API刷新认证状态
  async refreshFromAPI(): Promise<void> {
    if (this.apiCallInProgress) {
      console.log('API call already in progress, skipping...');
      return;
    }

    this.apiCallInProgress = true;
    this.updateState({ loading: true });

    try {
      const response = await fetch('/api/getRemainingGenerations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json() as any;
        
        // 获取本地用户信息
        let user: User | null = null;
        if (data.isLoggedIn && typeof window !== 'undefined') {
          const userString = localStorage.getItem('user');
          if (userString) {
            try {
              user = JSON.parse(userString);
            } catch (error) {
              console.error('Error parsing user from localStorage:', error);
              localStorage.removeItem('user');
            }
          }
        }

        this.updateState({
          user: data.isLoggedIn ? user : null,
          isLoggedIn: data.isLoggedIn,
          userPoints: data.userPoints || 0,
          loading: false
        });

        console.log('Auth state refreshed from API:', {
          isLoggedIn: data.isLoggedIn,
          userPoints: data.userPoints,
          hasLocalUser: !!user
        });
      } else {
        // API失败时保持本地状态
        this.updateState({ loading: false });
        console.log('API call failed, keeping local state');
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      this.updateState({ loading: false });
    } finally {
      this.apiCallInProgress = false;
    }
  }

  // 登录
  login(user: User, token: string) {
    if (typeof window === 'undefined') return;

    // 保存到本地存储
    localStorage.setItem('user', JSON.stringify(user));
    
    // 设置cookie
    const isSecure = window.location.protocol === 'https:';
    const cookieOptions = [
      `token=${token}`,
      'path=/',
      `max-age=${7 * 24 * 60 * 60}`,
      'SameSite=Lax',
      ...(isSecure ? ['Secure'] : [])
    ];
    document.cookie = cookieOptions.join('; ');

    // 更新状态
    this.updateState({
      user,
      isLoggedIn: true,
      loading: false
    });

    // 刷新API状态以获取点数
    setTimeout(() => {
      this.refreshFromAPI();
    }, 100);
  }

  // 登出
  logout() {
    if (typeof window === 'undefined') return;

    this.clearLocalStorage();
    
    this.updateState({
      user: null,
      isLoggedIn: false,
      userPoints: null,
      loading: false
    });
  }

  // 检查状态是否需要刷新
  shouldRefresh(): boolean {
    const now = Date.now();
    const lastUpdated = this.state.lastUpdated;
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - lastUpdated) > fiveMinutes;
  }
}

// 创建全局实例
export const authManager = new AuthManager();

// 为了向后兼容，导出一个hook
export function useAuthManager() {
  const [state, setState] = React.useState(authManager.getState());

  React.useEffect(() => {
    const unsubscribe = authManager.subscribe(setState);
    
    // 如果状态需要刷新，则刷新
    if (authManager.shouldRefresh()) {
      authManager.refreshFromAPI();
    }
    
    return unsubscribe;
  }, []);

  return {
    ...state,
    refreshAuth: () => authManager.refreshFromAPI(),
    logout: () => authManager.logout()
  };
}

// 在开发环境下添加到window对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authManager = authManager;
  console.log('🔧 Auth manager available: window.authManager');
}