/**
 * Cloudflare Worker 配置工具
 * Cloudflare Worker Configuration Utility
 * 
 * 提供与本地环境一致的配置管理
 * Provides consistent configuration management with local environment
 */

import { Env } from '../types';
import { WorkerLogger } from './workerLogger';

export interface WorkerConfig {
  jwtSecret: string;
  environment: 'development' | 'production';
  database: {
    binding: string;
    name: string;
  };
  cors: {
    allowedOrigins: string[];
    allowCredentials: boolean;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export class WorkerConfigManager {
  private config: WorkerConfig;
  private env: Env;
  private logger: WorkerLogger;
  
  constructor(env: Env) {
    this.env = env;
    this.logger = new WorkerLogger(env);
    this.config = this.loadConfig();
    this.validateConfig();
  }
  
  /**
   * 加载配置
   */
  private loadConfig(): WorkerConfig {
    const isProduction = this.env.ENVIRONMENT === 'production';
    
    return {
      jwtSecret: this.env.JWT_SECRET,
      environment: this.env.ENVIRONMENT,
      database: {
        binding: isProduction ? 'DB' : 'DB-DEV',
        name: isProduction ? 'flux-ai' : 'flux-ai-dev'
      },
      cors: {
        allowedOrigins: this.getAllowedOrigins(),
        allowCredentials: true
      },
      logging: {
        enabled: true,
        level: isProduction ? 'warn' : 'debug'
      }
    };
  }
  
  /**
   * 获取允许的源
   */
  private getAllowedOrigins(): string[] {
    const baseOrigins = [
      'http://localhost:3000',
      'http://10.124.124.163:3000'
    ];
    
    if (this.env.ENVIRONMENT === 'production') {
      baseOrigins.push(
        'https://flux-ai-img.com',
        'https://www.flux-ai-img.com'
      );
    } else {
      // 开发环境允许 ngrok 等内网穿透工具
      baseOrigins.push(
        'https://2932-2409-8924-873-a935-8da0-94be-fcf3-d0c7.ngrok-free.app'
      );
    }
    
    return baseOrigins;
  }
  
  /**
   * 验证配置
   */
  private validateConfig(): void {
    const errors: string[] = [];
    
    // 验证 JWT 密钥
    if (!this.config.jwtSecret) {
      errors.push('JWT_SECRET is required');
    } else if (this.config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters long');
    }
    
    // 验证环境
    if (!['development', 'production'].includes(this.config.environment)) {
      errors.push('ENVIRONMENT must be either "development" or "production"');
    }
    
    // 验证数据库绑定
    const dbBinding = this.config.database.binding;
    if (!this.env[dbBinding as keyof Env]) {
      errors.push(`Database binding "${dbBinding}" not found in environment`);
    }
    
    if (errors.length > 0) {
      throw new Error(`Worker configuration validation failed:\n${errors.join('\n')}`);
    }
  }
  
  /**
   * 获取配置
   */
  public getConfig(): WorkerConfig {
    return { ...this.config };
  }
  
  /**
   * 获取 JWT 密钥
   */
  public getJwtSecret(): string {
    return this.config.jwtSecret;
  }
  
  /**
   * 获取数据库实例
   */
  public getDatabase(): any {
    const binding = this.config.database.binding;
    return this.env[binding as keyof Env];
  }
  
  /**
   * 检查是否为生产环境
   */
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }
  
  /**
   * 检查是否为开发环境
   */
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }
  
  /**
   * 获取 CORS 头
   */
  public getCorsHeaders(origin?: string): Record<string, string> {
    const allowedOrigin = origin && this.config.cors.allowedOrigins.includes(origin) 
      ? origin 
      : this.config.cors.allowedOrigins[0];
    
    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': this.config.cors.allowCredentials ? 'true' : 'false',
    };
  }
  
  /**
   * 检查源是否被允许
   */
  public isOriginAllowed(origin: string): boolean {
    return this.config.cors.allowedOrigins.includes(origin);
  }
  
  /**
   * 获取日志器
   */
  public getLogger(): WorkerLogger {
    return this.logger;
  }
  
  /**
   * 记录日志（向后兼容）
   */
  public log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    this.logger[level](message, args.length > 0 ? args : undefined);
  }
  
  /**
   * 获取配置诊断信息
   */
  public getDiagnostics(): any {
    return {
      environment: this.config.environment,
      jwtSecretLength: this.config.jwtSecret.length,
      databaseBinding: this.config.database.binding,
      databaseAvailable: !!this.getDatabase(),
      allowedOrigins: this.config.cors.allowedOrigins,
      loggingEnabled: this.config.logging.enabled,
      loggingLevel: this.config.logging.level
    };
  }
}

/**
 * 创建标准化的响应
 */
export function createWorkerResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * 创建错误响应
 */
export function createWorkerErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  headers: Record<string, string> = {}
): Response {
  const errorData = {
    success: false,
    error: {
      message,
      code: code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };
  
  return createWorkerResponse(errorData, status, headers);
}

/**
 * 创建成功响应
 */
export function createWorkerSuccessResponse(
  data: any,
  headers: Record<string, string> = {}
): Response {
  const successData = {
    success: true,
    ...data
  };
  
  return createWorkerResponse(successData, 200, headers);
}