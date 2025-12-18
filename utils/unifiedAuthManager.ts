/**
 * 统一认证管理器
 * 简化版本，用于支持 useUnifiedAuth hook
 */

import { User } from './userUtils';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  userPoints: number | null;
  loading: boolean;
  token?: string | null;
  error?: string | null;
  lastUpdated?: number;
}

type AuthStateListener = (state: AuthState) => void;

class UnifiedAuthManager {
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    userPoints: null,
    loading: true,
  };

  private listeners: Set<AuthStateListener> = new Set();

  constructor() {
    // 初始化时检查认证状态
    this.refreshAuth();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    // 立即调用一次以获取当前状态
    listener(this.state);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * 更新状态
   */
  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  /**
   * 刷新认证状态
   */
  async refreshAuth() {
    try {
      this.setState({ loading: true });

      const response = await fetch('/api/auth/session');
      
      if (response.ok) {
        const session: any = await response.json();
        
        if (session && session.user) {
          this.setState({
            user: {
              userId: session.user.id,
              name: session.user.name || '',
              email: session.user.email || '',
              points: session.user.points || 0,
              subscription_type: null,
              subscription_start_date: null,
              subscription_end_date: null,
            },
            isAuthenticated: true,
            userPoints: session.user.points || 0,
            loading: false,
          });
        } else {
          this.setState({
            user: null,
            isAuthenticated: false,
            userPoints: null,
            loading: false,
          });
        }
      } else {
        this.setState({
          user: null,
          isAuthenticated: false,
          userPoints: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      this.setState({
        user: null,
        isAuthenticated: false,
        userPoints: null,
        loading: false,
      });
    }
  }

  /**
   * 登出
   */
  async logout() {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      });

      this.setState({
        user: null,
        isAuthenticated: false,
        userPoints: null,
        loading: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * 获取当前状态
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * 如果状态过期则刷新（兼容性方法）
   */
  async refreshIfStale() {
    // 简单实现：总是刷新
    await this.refreshAuth();
  }

  /**
   * 登录（兼容性方法）
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // 这个方法应该调用 NextAuth 的登录 API
    // 暂时返回未实现
    return {
      success: false,
      error: 'Not implemented - use NextAuth signIn instead'
    };
  }

  /**
   * Google 登录（兼容性方法）
   */
  async loginWithGoogle(credentials: GoogleCredentials): Promise<AuthResult> {
    // 这个方法应该调用 NextAuth 的 Google 登录
    // 暂时返回未实现
    return {
      success: false,
      error: 'Not implemented - use NextAuth signIn with Google provider instead'
    };
  }

  /**
   * 检查是否需要刷新（兼容性方法）
   */
  shouldRefresh(): boolean {
    // 简单实现：如果正在加载则不需要刷新
    return !this.state.loading;
  }

  /**
   * 获取调试信息（兼容性方法）
   */
  getDebugInfo() {
    return {
      state: this.state,
      listenerCount: this.listeners.size
    };
  }
}

// ==================== 额外的类型定义（用于兼容性） ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleCredentials {
  code: string;
  redirectUri: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// 导出单例
export const unifiedAuthManager = new UnifiedAuthManager();
