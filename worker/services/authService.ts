/**
 * Cloudflare Worker 认证服务
 * Cloudflare Worker Authentication Service
 * 
 * 使用统一的认证服务架构，与本地API保持一致
 * Uses unified authentication service architecture, consistent with local API
 */

import { Env } from '../types';
import { AuthenticationService } from '../../utils/authenticationService';
import { UserRepository } from '../../utils/userRepository';
import { AuthErrorHandler } from '../../utils/authErrorHandler';
import { AuthErrorCode } from '../../utils/authenticationService';

export interface WorkerAuthRequest {
  email: string;
  password?: string;
  googleToken?: string;
  name?: string;
}

export interface WorkerAuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    isGoogleUser: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class WorkerAuthService {
  private authService: AuthenticationService;
  private errorHandler: AuthErrorHandler;
  
  constructor(env: Env) {
    // 创建用户仓库实例，传入环境配置
    const userRepository = new UserRepository(env);
    
    // 创建认证服务实例
    this.authService = new AuthenticationService(
      userRepository,
      env.JWT_SECRET,
      env
    );
    
    // 创建错误处理器
    this.errorHandler = new AuthErrorHandler(
      env.ENVIRONMENT === 'development',
      'zh' // 默认中文，可以根据请求头调整
    );
  }
  
  /**
   * 处理用户登录
   */
  public async login(request: WorkerAuthRequest): Promise<WorkerAuthResponse> {
    try {
      const { email, password, googleToken } = request;
      
      // 验证输入
      if (!email) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '邮箱不能为空');
      }
      
      if (!password && !googleToken) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '密码或Google令牌不能为空');
      }
      
      let result;
      
      if (googleToken) {
        // Google OAuth 登录
        result = await this.authService.loginWithGoogle(googleToken, email);
      } else {
        // 用户名密码登录
        result = await this.authService.loginWithPassword(email, password!);
      }
      
      if (result.success && result.token && result.user) {
        return {
          success: true,
          token: result.token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            isGoogleUser: result.user.isGoogleUser || false
          }
        };
      } else {
        return this.createErrorResponse(
          result.error?.code || AuthErrorCode.INVALID_CREDENTIALS,
          result.error?.message || '登录失败'
        );
      }
      
    } catch (error) {
      console.error('Worker login error:', error);
      const authError = this.errorHandler.handleAuthError(error, 'worker-login');
      return this.createErrorResponse(authError.code, authError.message);
    }
  }
  
  /**
   * 处理用户注册
   */
  public async register(request: WorkerAuthRequest): Promise<WorkerAuthResponse> {
    try {
      const { email, password, name, googleToken } = request;
      
      // 验证输入
      if (!email || !name) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '邮箱和姓名不能为空');
      }
      
      if (!password && !googleToken) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '密码或Google令牌不能为空');
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '邮箱格式不正确');
      }
      
      // 验证密码强度（如果提供了密码）
      if (password && password.length < 6) {
        return this.createErrorResponse(AuthErrorCode.INVALID_CREDENTIALS, '密码长度至少6位');
      }
      
      const userData = {
        email: email.toLowerCase(),
        name,
        password: password || undefined,
        isGoogleUser: !!googleToken,
        googleToken
      };
      
      const result = await this.authService.registerUser(userData);
      
      if (result.success && result.token && result.user) {
        return {
          success: true,
          token: result.token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            isGoogleUser: result.user.isGoogleUser || false
          }
        };
      } else {
        return this.createErrorResponse(
          result.error?.code || AuthErrorCode.VALIDATION_ERROR,
          result.error?.message || '注册失败'
        );
      }
      
    } catch (error) {
      console.error('Worker register error:', error);
      const authError = this.errorHandler.handleAuthError(error, 'worker-register');
      return this.createErrorResponse(authError.code, authError.message);
    }
  }
  
  /**
   * 验证令牌
   */
  public async verifyToken(token: string): Promise<WorkerAuthResponse> {
    try {
      const result = await this.authService.verifyToken(token);
      
      if (result.isValid && result.user) {
        return {
          success: true,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            isGoogleUser: result.user.isGoogleUser || false
          }
        };
      } else {
        return this.createErrorResponse(
          result.error?.code || AuthErrorCode.TOKEN_INVALID,
          result.error?.message || '令牌无效'
        );
      }
      
    } catch (error) {
      console.error('Worker token verification error:', error);
      const authError = this.errorHandler.handleAuthError(error, 'worker-verify-token');
      return this.createErrorResponse(authError.code, authError.message);
    }
  }
  
  /**
   * 创建错误响应
   */
  private createErrorResponse(code: string, message: string): WorkerAuthResponse {
    return {
      success: false,
      error: {
        code,
        message
      }
    };
  }
  
  /**
   * 获取用户友好的错误消息
   */
  private getUserFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      [AuthErrorCode.INVALID_CREDENTIALS]: '邮箱或密码错误',
      [AuthErrorCode.USER_NOT_FOUND]: '用户不存在',
      [AuthErrorCode.EMAIL_ALREADY_EXISTS]: '该邮箱已被注册',
      [AuthErrorCode.GOOGLE_AUTH_FAILED]: 'Google登录失败',
      [AuthErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
      [AuthErrorCode.TOKEN_INVALID]: '登录状态无效，请重新登录',
      [AuthErrorCode.DATABASE_ERROR]: '数据库连接失败，请稍后重试',
      [AuthErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络',
      [AuthErrorCode.CONFIGURATION_ERROR]: '系统配置错误，请联系管理员'
    };
    
    return messages[code] || '未知错误';
  }
}