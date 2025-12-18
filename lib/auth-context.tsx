// 认证上下文 - 管理全局认证状态
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api-client';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updatePoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 恢复 token
    const savedToken = apiClient.getToken();
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.verifyToken();
      
      if (response.valid && response.user) {
        setUser(response.user);
      } else {
        // Token 无效，清除
        apiClient.setToken(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      apiClient.setToken(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    
    if (response.success && response.token) {
      setUser(response.user);
      setToken(response.token);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await apiClient.register({ name, email, password });
    
    if (response.success && response.token) {
      setUser(response.user);
      setToken(response.token);
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiClient.logout().catch(console.error);
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.verifyToken();
      if (response.valid && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const updatePoints = (newPoints: number) => {
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
        updatePoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
