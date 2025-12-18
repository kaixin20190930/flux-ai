/**
 * 配置助手工具
 * Configuration Helper Utility
 * 
 * 提供类型安全的环境变量访问和验证
 * Provides type-safe environment variable access and validation
 */

import { envConfig, EnvConfig } from './envConfig';

export class ConfigHelper {
  private static instance: ConfigHelper;
  private config: EnvConfig;
  private isValidated: boolean = false;
  
  private constructor() {
    this.config = envConfig.getConfig();
    this.validateOnInit();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigHelper {
    if (!ConfigHelper.instance) {
      ConfigHelper.instance = new ConfigHelper();
    }
    return ConfigHelper.instance;
  }
  
  /**
   * 初始化时验证配置
   */
  private validateOnInit(): void {
    const validation = envConfig.validate();
    
    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
      
      if (criticalErrors.length > 0) {
        console.error('🚨 Critical configuration errors detected:');
        criticalErrors.forEach(error => {
          console.error(`  - ${error.key}: ${error.message}`);
          if (error.suggestion) {
            console.error(`    💡 ${error.suggestion}`);
          }
        });
        
        if (envConfig.isDevelopment()) {
          console.error('\n🔧 Run "npm run validate-env --fix" to auto-fix common issues');
        }
      }
    }
    
    this.isValidated = true;
  }
  
  /**
   * 获取 JWT 密钥
   */
  public getJwtSecret(): string {
    const secret = this.config.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your environment variables.');
    }
    return secret;
  }
  
  /**
   * 获取数据库 URL
   */
  public getDatabaseUrl(): string | null {
    return this.config.DATABASE_URL || null;
  }
  
  /**
   * 获取 API URL
   */
  public getApiUrl(): string {
    return this.config.NEXT_PUBLIC_API_URL || 
           this.config.NEXT_PUBLIC_BASE_URL || 
           this.config.NEXT_PUBLIC_APP_URL || 
           'http://localhost:3000';
  }
  
  /**
   * 获取应用 URL
   */
  public getAppUrl(): string {
    return this.config.NEXT_PUBLIC_APP_URL || 
           this.config.NEXT_PUBLIC_BASE_URL || 
           'http://localhost:3000';
  }
  
  /**
   * 获取 Google OAuth 配置
   */
  public getGoogleOAuthConfig(): {
    clientId: string | null;
    clientSecret: string | null;
    redirectUri: string | null;
  } {
    return {
      clientId: this.config.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null,
      clientSecret: this.config.GOOGLE_CLIENT_SECRET || null,
      redirectUri: this.config.GOOGLE_REDIRECT_URI || null
    };
  }
  
  /**
   * 检查 Google OAuth 是否已配置
   */
  public isGoogleOAuthConfigured(): boolean {
    const config = this.getGoogleOAuthConfig();
    return !!(config.clientId && config.clientSecret && config.redirectUri);
  }
  
  /**
   * 获取 Stripe 配置
   */
  public getStripeConfig(): {
    publishableKey: string | null;
    secretKey: string | null;
    webhookSecret: string | null;
    basicPriceId: string | null;
    proMonthPriceId: string | null;
    proYearPriceId: string | null;
  } {
    return {
      publishableKey: this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
      secretKey: this.config.STRIPE_SECRET_KEY || null,
      webhookSecret: this.config.STRIPE_WEBHOOK_SECRET || null,
      basicPriceId: this.config.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || null,
      proMonthPriceId: this.config.NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID || null,
      proYearPriceId: this.config.NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID || null
    };
  }
  
  /**
   * 检查 Stripe 是否已配置
   */
  public isStripeConfigured(): boolean {
    const config = this.getStripeConfig();
    return !!(config.publishableKey && config.secretKey);
  }
  
  /**
   * 获取 Replicate API Token
   */
  public getReplicateApiToken(): string | null {
    return this.config.REPLICATE_API_TOKEN || null;
  }
  
  /**
   * 检查 Replicate 是否已配置
   */
  public isReplicateConfigured(): boolean {
    return !!this.getReplicateApiToken();
  }
  
  /**
   * 获取管理员用户 ID 列表
   */
  public getAdminUserIds(): string[] {
    const adminIds = this.config.ADMIN_USER_IDS;
    if (!adminIds) return [];
    
    return adminIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }
  
  /**
   * 检查用户是否为管理员
   */
  public isAdmin(userId: string): boolean {
    const adminIds = this.getAdminUserIds();
    return adminIds.includes(userId);
  }
  
  /**
   * 获取环境信息
   */
  public getEnvironment(): {
    nodeEnv: string;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    isCloudflare: boolean;
    isEdgeRuntime: boolean;
  } {
    return {
      nodeEnv: this.config.NODE_ENV,
      isProduction: envConfig.isProduction(),
      isDevelopment: envConfig.isDevelopment(),
      isTest: this.config.NODE_ENV === 'test',
      isCloudflare: envConfig.isCloudflare(),
      isEdgeRuntime: envConfig.isEdgeRuntime()
    };
  }
  
  /**
   * 获取配置值（通用方法）
   */
  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }
  
  /**
   * 检查配置是否存在
   */
  public has(key: keyof EnvConfig): boolean {
    return !!this.config[key];
  }
  
  /**
   * 获取必需的配置值
   */
  public getRequired<K extends keyof EnvConfig>(key: K): NonNullable<EnvConfig[K]> {
    const value = this.config[key];
    if (!value) {
      throw new Error(`Required configuration ${key} is not set`);
    }
    return value as NonNullable<EnvConfig[K]>;
  }
  
  /**
   * 获取配置值或默认值
   */
  public getOrDefault<K extends keyof EnvConfig>(
    key: K, 
    defaultValue: NonNullable<EnvConfig[K]>
  ): NonNullable<EnvConfig[K]> {
    return (this.config[key] as NonNullable<EnvConfig[K]>) || defaultValue;
  }
  
  /**
   * 验证当前配置
   */
  public validate(): boolean {
    const validation = envConfig.validate();
    return validation.isValid;
  }
  
  /**
   * 获取配置验证报告
   */
  public getValidationReport(): string {
    return envConfig.generateReport();
  }
  
  /**
   * 刷新配置（重新加载环境变量）
   */
  public refresh(): void {
    this.config = envConfig.getConfig();
    this.validateOnInit();
  }
  
  /**
   * 获取调试信息
   */
  public getDebugInfo(): any {
    if (!envConfig.isDevelopment()) {
      return null;
    }
    
    return {
      environment: this.getEnvironment(),
      configKeys: Object.keys(this.config).filter(key => this.config[key as keyof EnvConfig]),
      validation: envConfig.validate(),
      isValidated: this.isValidated
    };
  }
}

// 创建单例实例
export const configHelper = ConfigHelper.getInstance();

// 导出便捷函数
export const getJwtSecret = () => configHelper.getJwtSecret();
export const getDatabaseUrl = () => configHelper.getDatabaseUrl();
export const getApiUrl = () => configHelper.getApiUrl();
export const getAppUrl = () => configHelper.getAppUrl();
export const isProduction = () => configHelper.getEnvironment().isProduction;
export const isDevelopment = () => configHelper.getEnvironment().isDevelopment;
export const isCloudflare = () => configHelper.getEnvironment().isCloudflare;
export const isEdgeRuntime = () => configHelper.getEnvironment().isEdgeRuntime;

// 开发环境下添加到 window 对象以便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).configHelper = configHelper;
  console.log('🔧 Config helper available: window.configHelper');
}