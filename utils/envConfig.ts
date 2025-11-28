/**
 * 环境配置验证和管理工具
 * Environment Configuration Validation and Management Tool
 */

export interface EnvConfig {
  // 数据库配置
  DATABASE_URL?: string;
  
  // JWT 配置
  JWT_SECRET: string;
  
  // API 配置
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_BASE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  
  // Google OAuth 配置
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  
  // Stripe 配置
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID?: string;
  NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID?: string;
  NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID?: string;
  
  // Replicate API
  REPLICATE_API_TOKEN?: string;
  
  // 管理员配置
  ADMIN_USER_IDS?: string;
  
  // 环境标识
  NODE_ENV: 'development' | 'production' | 'test';
  CF_PAGES?: string;
  EDGE_RUNTIME?: string;
  NEXT_TELEMETRY_DISABLED?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
  suggestions: ConfigSuggestion[];
}

export interface ConfigError {
  key: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
  suggestion?: string;
}

export interface ConfigWarning {
  key: string;
  message: string;
  suggestion: string;
}

export interface ConfigSuggestion {
  key: string;
  message: string;
  action: string;
}

export class EnvConfigValidator {
  private config: EnvConfig;
  private environment: 'development' | 'production' | 'test';
  
  constructor() {
    this.config = this.loadConfig();
    this.environment = this.detectEnvironment();
  }
  
  /**
   * 加载环境配置
   */
  private loadConfig(): EnvConfig {
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET || '',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
      NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID,
      NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID,
      REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
      ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      CF_PAGES: process.env.CF_PAGES,
      EDGE_RUNTIME: process.env.EDGE_RUNTIME,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED
    };
  }
  
  /**
   * 检测当前环境
   */
  private detectEnvironment(): 'development' | 'production' | 'test' {
    if (process.env.CF_PAGES === '1' || process.env.VERCEL === '1') {
      return 'production';
    }
    
    if (process.env.NODE_ENV === 'test') {
      return 'test';
    }
    
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  
  /**
   * 验证环境配置
   */
  public validate(): ValidationResult {
    const errors: ConfigError[] = [];
    const warnings: ConfigWarning[] = [];
    const suggestions: ConfigSuggestion[] = [];
    
    // 验证必需的配置项
    this.validateRequired(errors);
    
    // 验证环境特定配置
    this.validateEnvironmentSpecific(errors, warnings);
    
    // 验证配置格式
    this.validateFormats(errors, warnings);
    
    // 生成建议
    this.generateSuggestions(suggestions);
    
    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'error').length === 0,
      errors,
      warnings,
      suggestions
    };
  }
  
  /**
   * 验证必需的配置项
   */
  private validateRequired(errors: ConfigError[]): void {
    // JWT_SECRET 是必需的
    if (!this.config.JWT_SECRET) {
      errors.push({
        key: 'JWT_SECRET',
        message: 'JWT_SECRET is required for authentication',
        severity: 'critical',
        suggestion: 'Generate a secure random string: openssl rand -base64 32'
      });
    } else if (this.config.JWT_SECRET.length < 32) {
      errors.push({
        key: 'JWT_SECRET',
        message: 'JWT_SECRET should be at least 32 characters long for security',
        severity: 'error',
        suggestion: 'Generate a longer secret: openssl rand -base64 32'
      });
    }
    
    // 生产环境必需的配置
    if (this.environment === 'production') {
      if (!this.config.DATABASE_URL) {
        errors.push({
          key: 'DATABASE_URL',
          message: 'DATABASE_URL is required in production',
          severity: 'critical',
          suggestion: 'Set up a production database and configure DATABASE_URL'
        });
      }
      
      if (!this.config.NEXT_PUBLIC_APP_URL) {
        errors.push({
          key: 'NEXT_PUBLIC_APP_URL',
          message: 'NEXT_PUBLIC_APP_URL is required in production',
          severity: 'critical',
          suggestion: 'Set NEXT_PUBLIC_APP_URL to your production domain'
        });
      }
    }
  }
  
  /**
   * 验证环境特定配置
   */
  private validateEnvironmentSpecific(errors: ConfigError[], warnings: ConfigWarning[]): void {
    // Google OAuth 配置验证
    const hasGoogleClientId = !!this.config.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const hasGoogleSecret = !!this.config.GOOGLE_CLIENT_SECRET;
    const hasGoogleRedirect = !!this.config.GOOGLE_REDIRECT_URI;
    
    if (hasGoogleClientId || hasGoogleSecret || hasGoogleRedirect) {
      if (!hasGoogleClientId) {
        errors.push({
          key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
          message: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is required when using Google OAuth',
          severity: 'error',
          suggestion: 'Configure Google OAuth in Google Cloud Console'
        });
      }
      
      if (!hasGoogleSecret) {
        errors.push({
          key: 'GOOGLE_CLIENT_SECRET',
          message: 'GOOGLE_CLIENT_SECRET is required when using Google OAuth',
          severity: 'error',
          suggestion: 'Get client secret from Google Cloud Console'
        });
      }
      
      if (!hasGoogleRedirect) {
        errors.push({
          key: 'GOOGLE_REDIRECT_URI',
          message: 'GOOGLE_REDIRECT_URI is required when using Google OAuth',
          severity: 'error',
          suggestion: 'Set GOOGLE_REDIRECT_URI to your callback URL'
        });
      }
    }
    
    // Stripe 配置验证
    const hasStripePublic = !!this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const hasStripeSecret = !!this.config.STRIPE_SECRET_KEY;
    
    if (hasStripePublic || hasStripeSecret) {
      if (!hasStripePublic) {
        warnings.push({
          key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
          message: 'Stripe publishable key is missing',
          suggestion: 'Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for payment processing'
        });
      }
      
      if (!hasStripeSecret) {
        warnings.push({
          key: 'STRIPE_SECRET_KEY',
          message: 'Stripe secret key is missing',
          suggestion: 'Add STRIPE_SECRET_KEY for payment processing'
        });
      }
    }
    
    // Cloudflare 环境验证
    if (this.config.CF_PAGES === '1') {
      if (!this.config.EDGE_RUNTIME) {
        warnings.push({
          key: 'EDGE_RUNTIME',
          message: 'EDGE_RUNTIME not set in Cloudflare environment',
          suggestion: 'Set EDGE_RUNTIME=1 for optimal Cloudflare Pages performance'
        });
      }
    }
  }
  
  /**
   * 验证配置格式
   */
  private validateFormats(errors: ConfigError[], warnings: ConfigWarning[]): void {
    // 验证 URL 格式
    const urlFields = [
      'DATABASE_URL',
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_APP_URL',
      'GOOGLE_REDIRECT_URI'
    ] as const;
    
    urlFields.forEach(field => {
      const value = this.config[field];
      if (value && !this.isValidUrl(value)) {
        errors.push({
          key: field,
          message: `${field} is not a valid URL format`,
          severity: 'error',
          suggestion: `Ensure ${field} starts with http:// or https://`
        });
      }
    });
    
    // 验证 Google Client ID 格式
    if (this.config.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
        !this.config.NEXT_PUBLIC_GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
      warnings.push({
        key: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
        message: 'Google Client ID format may be incorrect',
        suggestion: 'Google Client ID should end with .apps.googleusercontent.com'
      });
    }
    
    // 验证 Stripe key 格式
    if (this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 
        !this.config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
      warnings.push({
        key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        message: 'Stripe publishable key format may be incorrect',
        suggestion: 'Stripe publishable key should start with pk_'
      });
    }
    
    if (this.config.STRIPE_SECRET_KEY && 
        !this.config.STRIPE_SECRET_KEY.startsWith('sk_')) {
      warnings.push({
        key: 'STRIPE_SECRET_KEY',
        message: 'Stripe secret key format may be incorrect',
        suggestion: 'Stripe secret key should start with sk_'
      });
    }
  }
  
  /**
   * 生成配置建议
   */
  private generateSuggestions(suggestions: ConfigSuggestion[]): void {
    // 开发环境建议
    if (this.environment === 'development') {
      if (!this.config.NEXT_TELEMETRY_DISABLED) {
        suggestions.push({
          key: 'NEXT_TELEMETRY_DISABLED',
          message: 'Consider disabling Next.js telemetry in development',
          action: 'Add NEXT_TELEMETRY_DISABLED=1 to your .env.local'
        });
      }
      
      if (!this.config.REPLICATE_API_TOKEN) {
        suggestions.push({
          key: 'REPLICATE_API_TOKEN',
          message: 'Replicate API token not configured',
          action: 'Add REPLICATE_API_TOKEN for AI image generation features'
        });
      }
    }
    
    // 生产环境建议
    if (this.environment === 'production') {
      if (!this.config.ADMIN_USER_IDS) {
        suggestions.push({
          key: 'ADMIN_USER_IDS',
          message: 'No admin users configured',
          action: 'Set ADMIN_USER_IDS with comma-separated user IDs'
        });
      }
      
      if (this.config.NEXT_PUBLIC_APP_URL && this.config.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        suggestions.push({
          key: 'NEXT_PUBLIC_APP_URL',
          message: 'Production URL still points to localhost',
          action: 'Update NEXT_PUBLIC_APP_URL to your production domain'
        });
      }
    }
  }
  
  /**
   * 验证 URL 格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取当前配置
   */
  public getConfig(): EnvConfig {
    return { ...this.config };
  }
  
  /**
   * 获取当前环境
   */
  public getEnvironment(): string {
    return this.environment;
  }
  
  /**
   * 生成配置报告
   */
  public generateReport(): string {
    const validation = this.validate();
    const lines: string[] = [];
    
    lines.push('=== Environment Configuration Report ===');
    lines.push(`Environment: ${this.environment}`);
    lines.push(`Validation Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push('');
    
    if (validation.errors.length > 0) {
      lines.push('🚨 ERRORS:');
      validation.errors.forEach(error => {
        lines.push(`  ${error.severity.toUpperCase()}: ${error.key} - ${error.message}`);
        if (error.suggestion) {
          lines.push(`    💡 Suggestion: ${error.suggestion}`);
        }
      });
      lines.push('');
    }
    
    if (validation.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      validation.warnings.forEach(warning => {
        lines.push(`  ${warning.key} - ${warning.message}`);
        lines.push(`    💡 Suggestion: ${warning.suggestion}`);
      });
      lines.push('');
    }
    
    if (validation.suggestions.length > 0) {
      lines.push('💡 SUGGESTIONS:');
      validation.suggestions.forEach(suggestion => {
        lines.push(`  ${suggestion.key} - ${suggestion.message}`);
        lines.push(`    🔧 Action: ${suggestion.action}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * 检查特定配置是否存在
   */
  public hasConfig(key: keyof EnvConfig): boolean {
    return !!this.config[key];
  }
  
  /**
   * 获取配置值
   */
  public getConfigValue(key: keyof EnvConfig): string | undefined {
    return this.config[key];
  }
  
  /**
   * 检查是否为生产环境
   */
  public isProduction(): boolean {
    return this.environment === 'production';
  }
  
  /**
   * 检查是否为开发环境
   */
  public isDevelopment(): boolean {
    return this.environment === 'development';
  }
  
  /**
   * 检查是否为 Cloudflare 环境
   */
  public isCloudflare(): boolean {
    return this.config.CF_PAGES === '1';
  }
  
  /**
   * 检查是否启用了边缘运行时
   */
  public isEdgeRuntime(): boolean {
    return this.config.EDGE_RUNTIME === '1';
  }
}

// 创建单例实例
export const envConfig = new EnvConfigValidator();

// 开发环境下添加到 window 对象以便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).envConfig = envConfig;
  console.log('🔧 Environment config available: window.envConfig');
}