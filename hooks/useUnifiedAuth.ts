import { useState, useEffect, useCallback } from 'react';
import { User } from '@/utils/userUtils';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  userPoints: number | null;
  loading: boolean;
}

interface AuthApiResponse {
  remainingFreeGenerations: number;
  isLoggedIn: boolean;
  userPoints: number;
  userId: string | null;
}

export function useUnifiedAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    userPoints: null,
    loading: true,
  });

  const fetchAuthData = useCallback(async () => {
    try {
      // 先检查本地状态作为初始状态
      let localUser: User | null = null;
      let hasToken = false;
      
      if (typeof window !== 'undefined') {
        const userString = localStorage.getItem('user');
        hasToken = document.cookie.includes('token=');
        
        if (userString && hasToken) {
          try {
            localUser = JSON.parse(userString);
            // 设置初始状态，但标记为loading
            setAuthState({
              user: localUser,
              isLoggedIn: true,
              userPoints: null,
              loading: true,
            });
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            localStorage.removeItem('user');
            localUser = null;
          }
        }
      }
      
      // 调用API获取最新状态
      const response = await fetch('/api/getRemainingGenerations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json() as AuthApiResponse;
        
        // API状态优先于本地状态
        if (data.isLoggedIn) {
          // 如果API确认已登录，使用本地用户数据或API返回的用户ID
          let finalUser: User | null = localUser;
          
          if (!localUser && data.userId) {
            finalUser = {
              userId: data.userId,
              name: '',
              email: '',
              points: data.userPoints || 0,
              subscription_type: null,
              subscription_start_date: null,
              subscription_end_date: null
            };
          }
          
          setAuthState({
            user: finalUser,
            isLoggedIn: true,
            userPoints: data.userPoints || 0,
            loading: false,
          });
          
          // 如果本地没有用户数据但API确认已登录，尝试获取用户信息
          if (!localUser && data.userId) {
            console.log('User logged in but no local data, fetching user info...');
            // 这里可以添加获取用户详细信息的逻辑
          }
        } else {
          // API确认未登录，清除本地数据
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
          }
          
          setAuthState({
            user: null,
            isLoggedIn: false,
            userPoints: 0,
            loading: false,
          });
        }
        
        console.log('Auth state from API:', { 
          isLoggedIn: data.isLoggedIn, 
          userPoints: data.userPoints,
          userId: data.userId
        });
      } else {
        // API失败时的处理
        console.error('API request failed:', response.status, response.statusText);
        
        if (response.status === 401) {
          // 未授权，清除本地数据
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
          }
          
          setAuthState({
            user: null,
            isLoggedIn: false,
            userPoints: 0,
            loading: false,
          });
        } else {
          // 其他错误（如网络问题），保持本地状态
          console.log('API failed but keeping local state for network issues');
          setAuthState({
            user: localUser,
            isLoggedIn: !!(localUser && hasToken),
            userPoints: 0,
            loading: false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching auth data:', error);
      
      // 网络错误时，清除本地数据以确保安全
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      }
      
      setAuthState({
        user: null,
        isLoggedIn: false,
        userPoints: 0,
        loading: false,
      });
    }
  }, []);

  const refreshAuth = useCallback(() => {
    fetchAuthData();
  }, [fetchAuthData]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
    setAuthState({
      user: null,
      isLoggedIn: false,
      userPoints: null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    fetchAuthData();
    
    // 监听认证状态变化事件
    const handleAuthStateChange = () => {
      console.log('Auth state change event received, refreshing auth data...');
      fetchAuthData();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-state-changed', handleAuthStateChange);
      
      return () => {
        window.removeEventListener('auth-state-changed', handleAuthStateChange);
      };
    }
  }, [fetchAuthData]);

  return {
    ...authState,
    refreshAuth,
    logout,
  };
}