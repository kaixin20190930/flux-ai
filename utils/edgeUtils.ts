// Edge Runtime 兼容的工具函数

// 替代 crypto.randomUUID()
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 简单的哈希函数（替代 crypto.createHash）
export async function simpleHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 简单的 JWT 验证（替代 jsonwebtoken）
export function parseJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// 环境变量获取（Edge Runtime 兼容）
export function getEnvVar(name: string, defaultValue?: string): string {
  // 在 Edge Runtime 中，环境变量需要在构建时注入
  // 这里提供一个基本的实现
  return defaultValue || '';
}

// 简单的错误响应
export function createErrorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 简单的成功响应
export function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ==================== 扩展功能 ====================

/**
 * Edge Runtime 兼容的认证管理器
 */
export class EdgeAuth {
  private static readonly SALT = 'flux-ai-salt-2024';
  
  /**
   * 使用 Web Crypto API 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log('[EdgeAuth.verifyPassword] Verifying password');
    console.log('[EdgeAuth.verifyPassword] Input password length:', password.length);
    console.log('[EdgeAuth.verifyPassword] Stored hash length:', hash.length);
    console.log('[EdgeAuth.verifyPassword] Stored hash:', hash);
    
    const computedHash = await this.hashPassword(password);
    console.log('[EdgeAuth.verifyPassword] Computed hash:', computedHash);
    console.log('[EdgeAuth.verifyPassword] Hashes match:', computedHash === hash);
    
    return computedHash === hash;
  }
  
  /**
   * 创建 JWT Token
   */
  static async createJWT(payload: any, secret: string, expiresIn: number = 24 * 60 * 60): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureArray = Array.from(new Uint8Array(signature));
    const encodedSignature = btoa(String.fromCharCode(...signatureArray)).replace(/=/g, '');
    
    return `${data}.${encodedSignature}`;
  }
  
  /**
   * 验证 JWT Token
   */
  static async verifyJWT(token: string, secret: string): Promise<any> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const data = `${encodedHeader}.${encodedPayload}`;
      
      // 验证签名
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
      
      if (!isValid) return null;
      
      // 解析 payload
      const payload = JSON.parse(atob(encodedPayload));
      
      // 检查过期时间
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }
  
  /**
   * 从请求中提取 Bearer Token
   */
  static extractBearerToken(request: Request): string | null {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.substring(7);
  }
  
  /**
   * 从 Cookie 中提取 Token
   */
  static extractCookieToken(request: Request, cookieName: string = 'auth-token'): string | null {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith(`${cookieName}=`));
    
    return authCookie ? authCookie.substring(cookieName.length + 1) : null;
  }
}

/**
 * Edge Runtime 兼容的数据库操作
 */
export class EdgeDB {
  /**
   * 执行 D1 数据库查询
   */
  static async query(env: any, sql: string, params: any[] = []): Promise<any> {
    try {
      if (!env.DB) {
        throw new Error('D1 database binding not found');
      }
      
      const stmt = env.DB.prepare(sql);
      const result = await stmt.bind(...params).all();
      return result;
    } catch (error) {
      console.error('D1 Query Error:', error);
      throw error;
    }
  }
  
  /**
   * 执行单条查询并返回第一行
   */
  static async queryFirst(env: any, sql: string, params: any[] = []): Promise<any> {
    const result = await this.query(env, sql, params);
    return result.results?.[0] || null;
  }
  
  /**
   * 执行事务
   */
  static async transaction(env: any, queries: Array<{sql: string, params: any[]}>): Promise<any> {
    try {
      if (!env.DB) {
        throw new Error('D1 database binding not found');
      }
      
      const statements = queries.map(q => env.DB.prepare(q.sql).bind(...q.params));
      const result = await env.DB.batch(statements);
      return result;
    } catch (error) {
      console.error('D1 Transaction Error:', error);
      throw error;
    }
  }
}

/**
 * Edge Runtime 兼容的存储操作
 */
export class EdgeStorage {
  /**
   * 上传文件到 R2
   */
  static async uploadFile(env: any, key: string, file: File | ArrayBuffer, metadata?: any): Promise<string> {
    try {
      if (!env.STORAGE) {
        throw new Error('R2 storage binding not found');
      }
      
      await env.STORAGE.put(key, file, { customMetadata: metadata });
      return key;
    } catch (error) {
      console.error('R2 Upload Error:', error);
      throw error;
    }
  }
  
  /**
   * 从 R2 获取文件
   */
  static async getFile(env: any, key: string): Promise<any> {
    try {
      if (!env.STORAGE) {
        throw new Error('R2 storage binding not found');
      }
      
      const object = await env.STORAGE.get(key);
      return object;
    } catch (error) {
      console.error('R2 Get Error:', error);
      throw error;
    }
  }
  
  /**
   * 删除 R2 文件
   */
  static async deleteFile(env: any, key: string): Promise<void> {
    try {
      if (!env.STORAGE) {
        throw new Error('R2 storage binding not found');
      }
      
      await env.STORAGE.delete(key);
    } catch (error) {
      console.error('R2 Delete Error:', error);
      throw error;
    }
  }
}

/**
 * Edge Runtime 兼容的缓存操作
 */
export class EdgeCache {
  /**
   * 设置缓存
   */
  static async set(env: any, key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      if (!env.KV) {
        console.warn('KV binding not found, skipping cache');
        return;
      }
      
      await env.KV.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.error('KV Set Error:', error);
    }
  }
  
  /**
   * 获取缓存
   */
  static async get(env: any, key: string): Promise<any> {
    try {
      if (!env.KV) {
        return null;
      }
      
      const value = await env.KV.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('KV Get Error:', error);
      return null;
    }
  }
  
  /**
   * 删除缓存
   */
  static async delete(env: any, key: string): Promise<void> {
    try {
      if (!env.KV) {
        return;
      }
      
      await env.KV.delete(key);
    } catch (error) {
      console.error('KV Delete Error:', error);
    }
  }
}

/**
 * 通用工具函数
 */
export class EdgeUtils {
  /**
   * 安全的 JSON 解析
   */
  static safeJsonParse(str: string, defaultValue: any = null): any {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }
  
  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * 延迟执行
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取客户端 IP
   */
  static getClientIP(request: Request): string {
    return request.headers.get('CF-Connecting-IP') || 
           request.headers.get('X-Forwarded-For') || 
           request.headers.get('X-Real-IP') || 
           'unknown';
  }
  
  /**
   * 获取用户代理
   */
  static getUserAgent(request: Request): string {
    return request.headers.get('User-Agent') || 'unknown';
  }
  
  /**
   * CORS 响应头
   */
  static getCorsHeaders(origin?: string): HeadersInit {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  /**
   * 创建带 CORS 的响应
   */
  static createCorsResponse(data: any, status: number = 200, origin?: string): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCorsHeaders(origin)
      }
    });
  }
}