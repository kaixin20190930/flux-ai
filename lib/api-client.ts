// API 客户端 - 统一管理所有 API 调用
import { API_CONFIG } from './api-config';

export class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'Request failed');
    }

    return data;
  }

  // ==================== 认证相关 ====================
  
  async register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const response = await this.request(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async verifyToken() {
    return this.request(API_CONFIG.endpoints.auth.verifyToken, {
      method: 'POST',
    });
  }

  async logout() {
    try {
      await this.request(API_CONFIG.endpoints.auth.logout, {
        method: 'POST',
      });
    } finally {
      this.setToken(null);
    }
  }

  // ==================== 积分相关 ====================
  
  async getPoints() {
    return this.request(API_CONFIG.endpoints.points.balance);
  }

  async addPoints(amount: number) {
    return this.request(API_CONFIG.endpoints.points.add, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async deductPoints(amount: number) {
    return this.request(API_CONFIG.endpoints.points.deduct, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // ==================== 生成相关 ====================
  
  async recordGeneration(data: {
    prompt: string;
    model: string;
    pointsUsed: number;
  }) {
    return this.request(API_CONFIG.endpoints.generation.record, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGenerations(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`${API_CONFIG.endpoints.generation.get}${params}`);
  }

  async updateGeneration(id: string, data: {
    status?: string;
    imageUrl?: string;
    error?: string;
  }) {
    return this.request(API_CONFIG.endpoints.generation.update, {
      method: 'POST',
      body: JSON.stringify({ id, ...data }),
    });
  }

  async checkRateLimit() {
    return this.request(API_CONFIG.endpoints.generation.checkRateLimit);
  }

  // ==================== 交易相关 ====================
  
  async createTransaction(data: {
    type: string;
    amount: number;
    description?: string;
  }) {
    return this.request(API_CONFIG.endpoints.transaction.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactions() {
    return this.request(API_CONFIG.endpoints.transaction.list);
  }

  // ==================== 工具相关 ====================
  
  async recordToolUsage(data: {
    toolName: string;
    inputImageUrl: string;
    outputImageUrl?: string;
  }) {
    return this.request(API_CONFIG.endpoints.tools.record, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getToolUsage() {
    return this.request(API_CONFIG.endpoints.tools.list);
  }
}

// 导出单例
export const apiClient = new APIClient();
