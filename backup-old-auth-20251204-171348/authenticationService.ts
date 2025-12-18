import { UserRepository, User, CreateUserData, UserCredentials, GoogleUserData } from './userRepository';
import { createJWT, verifyJWT, hashPassword, verifyPassword } from './auth';
import { Env } from '@/worker/types';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { logWithTimestamp } from './logUtils';

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: UserInfo;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  debugInfo?: any;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  points: number;
  isGoogleUser: boolean;
  status: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  user?: UserInfo;
  error?: AuthError;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password?: string;
  isGoogleUser?: boolean;
  googleId?: string;
}

// Authentication error codes
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  GOOGLE_AUTH_FAILED = 'GOOGLE_AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PASSWORD_HASH_ERROR = 'PASSWORD_HASH_ERROR',
  JWT_CREATION_ERROR = 'JWT_CREATION_ERROR'
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, { en: string; zh: string }> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    en: 'Invalid email or password',
    zh: '邮箱或密码错误'
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    en: 'User not found',
    zh: '用户不存在'
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    en: 'An account with this email already exists',
    zh: '该邮箱已被注册'
  },
  [AuthErrorCode.GOOGLE_AUTH_FAILED]: {
    en: 'Google authentication failed',
    zh: 'Google登录失败'
  },
  [AuthErrorCode.TOKEN_EXPIRED]: {
    en: 'Your session has expired. Please log in again',
    zh: '会话已过期，请重新登录'
  },
  [AuthErrorCode.TOKEN_INVALID]: {
    en: 'Invalid authentication token',
    zh: '无效的认证令牌'
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    en: 'Database connection error. Please try again later',
    zh: '数据库连接错误，请稍后重试'
  },
  [AuthErrorCode.NETWORK_ERROR]: {
    en: 'Network error. Please check your connection',
    zh: '网络错误，请检查网络连接'
  },
  [AuthErrorCode.CONFIGURATION_ERROR]: {
    en: 'System configuration error',
    zh: '系统配置错误'
  },
  [AuthErrorCode.VALIDATION_ERROR]: {
    en: 'Invalid input data',
    zh: '输入数据无效'
  },
  [AuthErrorCode.PASSWORD_HASH_ERROR]: {
    en: 'Password processing error',
    zh: '密码处理错误'
  },
  [AuthErrorCode.JWT_CREATION_ERROR]: {
    en: 'Authentication token creation failed',
    zh: '认证令牌创建失败'
  }
};

export class AuthenticationService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private env: Env | null = null;
  private isDevelopment: boolean;

  constructor(userRepository?: UserRepository, jwtSecret?: string, env?: Env) {
    this.userRepository = userRepository || new UserRepository();
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || '';
    this.env = env || null;
    this.isDevelopment = process.env.NODE_ENV === 'development';

    // Initialize user repository with environment if provided
    if (env && this.userRepository) {
      this.userRepository.initialize(env);
    }

    // Only validate configuration on server-side
    // Skip validation in browser environment
    if (typeof window === 'undefined') {
      this.validateConfiguration();
    }
  }

  /**
   * Validate service configuration
   */
  private validateConfiguration(): void {
    if (!this.jwtSecret) {
      const error = this.createAuthError(
        AuthErrorCode.CONFIGURATION_ERROR,
        'JWT_SECRET is not configured',
        { missingConfig: 'JWT_SECRET' }
      );
      
      if (this.isDevelopment) {
        console.error('⚠️ Authentication Service Configuration Error:', error);
      }
      
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
        details: error.details,
        timestamp: new Date()
      });
    }
  }

  /**
   * Initialize service with environment
   */
  public initialize(env: Env): void {
    this.env = env;
    this.jwtSecret = env.JWT_SECRET || this.jwtSecret;
    this.userRepository.initialize(env);
    
    // Only validate configuration on server-side
    if (typeof window === 'undefined') {
      this.validateConfiguration();
    }
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(email: string, password: string): Promise<AuthResult> {
    try {
      logWithTimestamp('Starting password login for email:', email);

      // Validate input
      if (!email || !password) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Email and password are required',
          { email: !!email, password: !!password }
        );
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Invalid email format',
          { email }
        );
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        logWithTimestamp('User not found for email:', email);
        return this.createFailureResult(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Invalid email or password'
        );
      }

      // Check if user is active
      if (user.status !== 'active') {
        logWithTimestamp('User account is not active:', user.status);
        return this.createFailureResult(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Account is not active',
          { status: user.status }
        );
      }

      // Validate credentials
      const isValidPassword = await this.userRepository.validateCredentials(email, password);
      if (!isValidPassword) {
        logWithTimestamp('Invalid password for user:', email);
        return this.createFailureResult(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Invalid email or password'
        );
      }

      // Update last login time
      await this.userRepository.updateLastLogin(user.id);

      // Generate JWT token
      const token = await this.generateUserToken(user);

      logWithTimestamp('Password login successful for user:', user.id);

      return {
        success: true,
        token,
        user: this.mapUserToUserInfo(user)
      };

    } catch (error) {
      logWithTimestamp('Password login error:', error);
      return this.handleAuthError(error, 'loginWithPassword');
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(googleToken: string, email: string): Promise<AuthResult> {
    try {
      logWithTimestamp('Starting Google OAuth login for email:', email);

      // Validate input
      if (!googleToken || !email) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Google token and email are required',
          { hasToken: !!googleToken, hasEmail: !!email }
        );
      }

      // Verify Google token and get user data
      const googleUserData = await this.verifyGoogleToken(googleToken, email);
      if (!googleUserData) {
        return this.createFailureResult(
          AuthErrorCode.GOOGLE_AUTH_FAILED,
          'Failed to verify Google token'
        );
      }

      // Try to find existing user by email
      let user = await this.userRepository.findByEmail(googleUserData.email);

      if (user) {
        // Existing user - update Google ID if not set
        if (!user.isGoogleUser || !user.googleId) {
          user = await this.userRepository.updateUser(user.id, {
            isGoogleUser: true,
            googleId: googleUserData.googleId
          });
        }

        // Check if user is active
        if (user.status !== 'active') {
          logWithTimestamp('Google user account is not active:', user.status);
          return this.createFailureResult(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Account is not active',
            { status: user.status }
          );
        }
      } else {
        // New user - create account
        logWithTimestamp('Creating new Google user:', googleUserData.email);
        user = await this.userRepository.createUser({
          name: googleUserData.name,
          email: googleUserData.email,
          isGoogleUser: true,
          googleId: googleUserData.googleId,
          points: 50 // Default points for new users
        });
      }

      // Update last login time
      await this.userRepository.updateLastLogin(user.id);

      // Generate JWT token
      const token = await this.generateUserToken(user);

      logWithTimestamp('Google login successful for user:', user.id);

      return {
        success: true,
        token,
        user: this.mapUserToUserInfo(user)
      };

    } catch (error) {
      logWithTimestamp('Google login error:', error);
      return this.handleAuthError(error, 'loginWithGoogle');
    }
  }

  /**
   * Register new user
   */
  async registerUser(userData: UserRegistrationData): Promise<AuthResult> {
    try {
      logWithTimestamp('Starting user registration for email:', userData.email);

      // Validate input
      if (!userData.email || !userData.name) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Email and name are required',
          { email: !!userData.email, name: !!userData.name }
        );
      }

      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Invalid email format',
          { email: userData.email }
        );
      }

      // For non-Google users, password is required
      if (!userData.isGoogleUser && !userData.password) {
        return this.createFailureResult(
          AuthErrorCode.VALIDATION_ERROR,
          'Password is required for email registration'
        );
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return this.createFailureResult(
          AuthErrorCode.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists'
        );
      }

      // Create user
      const user = await this.userRepository.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        isGoogleUser: userData.isGoogleUser || false,
        googleId: userData.googleId,
        points: 50 // Default points for new users
      });

      // Generate JWT token
      const token = await this.generateUserToken(user);

      logWithTimestamp('User registration successful:', user.id);

      return {
        success: true,
        token,
        user: this.mapUserToUserInfo(user)
      };

    } catch (error) {
      logWithTimestamp('User registration error:', error);
      return this.handleAuthError(error, 'registerUser');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token) {
        return {
          isValid: false,
          error: this.createAuthError(
            AuthErrorCode.TOKEN_INVALID,
            'Token is required'
          )
        };
      }

      // Verify JWT
      const decoded = await verifyJWT(token, this.jwtSecret);
      
      // Get user from database to ensure they still exist and are active
      const user = await this.userRepository.findById(decoded.userId || decoded.id);
      if (!user || user.status !== 'active') {
        return {
          isValid: false,
          error: this.createAuthError(
            AuthErrorCode.USER_NOT_FOUND,
            'User not found or inactive'
          )
        };
      }

      return {
        isValid: true,
        user: this.mapUserToUserInfo(user)
      };

    } catch (error) {
      logWithTimestamp('Token verification error:', error);
      
      // Check if it's an expiration error
      if (error instanceof Error && error.message.includes('expired')) {
        return {
          isValid: false,
          error: this.createAuthError(
            AuthErrorCode.TOKEN_EXPIRED,
            'Token has expired'
          )
        };
      }

      return {
        isValid: false,
        error: this.createAuthError(
          AuthErrorCode.TOKEN_INVALID,
          'Invalid token',
          this.isDevelopment ? { originalError: error } : undefined
        )
      };
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(token: string): Promise<AuthResult> {
    try {
      // Verify current token
      const validation = await this.verifyToken(token);
      if (!validation.isValid || !validation.user) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Get fresh user data
      const user = await this.userRepository.findById(validation.user.id);
      if (!user || user.status !== 'active') {
        return this.createFailureResult(
          AuthErrorCode.USER_NOT_FOUND,
          'User not found or inactive'
        );
      }

      // Generate new token
      const newToken = await this.generateUserToken(user);

      logWithTimestamp('Token refresh successful for user:', user.id);

      return {
        success: true,
        token: newToken,
        user: this.mapUserToUserInfo(user)
      };

    } catch (error) {
      logWithTimestamp('Token refresh error:', error);
      return this.handleAuthError(error, 'refreshToken');
    }
  }

  /**
   * Generate JWT token for user
   */
  private async generateUserToken(user: User): Promise<string> {
    try {
      const payload = {
        userId: user.id,
        id: user.id, // For backward compatibility
        email: user.email,
        name: user.name,
        points: user.points,
        isGoogleUser: user.isGoogleUser
      };

      return await createJWT(payload, this.jwtSecret);
    } catch (error) {
      logWithTimestamp('JWT creation error:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to create authentication token',
        details: this.isDevelopment ? { originalError: error } : undefined,
        timestamp: new Date()
      });
    }
  }

  /**
   * Verify Google token (simplified implementation)
   * In a real implementation, this would verify the token with Google's API
   */
  private async verifyGoogleToken(token: string, email: string): Promise<GoogleUserData | null> {
    try {
      // This is a simplified implementation
      // In production, you would verify the token with Google's API
      // For now, we'll extract basic info from the provided data
      
      // Basic validation
      if (!token || !email) {
        return null;
      }

      // In a real implementation, you would:
      // 1. Verify the token with Google's API
      // 2. Extract user information from the verified token
      // 3. Return the user data
      
      // For now, we'll create a mock response based on the email
      const name = email.split('@')[0]; // Simple name extraction
      const googleId = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        googleId
      };

    } catch (error) {
      logWithTimestamp('Google token verification error:', error);
      return null;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Map User to UserInfo
   */
  private mapUserToUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      isGoogleUser: user.isGoogleUser,
      status: user.status
    };
  }

  /**
   * Create authentication error
   */
  private createAuthError(
    code: AuthErrorCode,
    message: string,
    details?: any
  ): AuthError {
    return {
      code,
      message: this.getLocalizedMessage(code) || message,
      details,
      debugInfo: this.isDevelopment ? {
        originalMessage: message,
        timestamp: new Date().toISOString(),
        details
      } : undefined
    };
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    code: AuthErrorCode,
    message: string,
    details?: any
  ): AuthResult {
    return {
      success: false,
      error: this.createAuthError(code, message, details)
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any, context: string): AuthResult {
    logWithTimestamp(`Authentication error in ${context}:`, error);

    // Handle known error types
    if (error instanceof AppErrorClass) {
      const authErrorCode = this.mapAppErrorToAuthError(error.code);
      return this.createFailureResult(
        authErrorCode,
        error.message,
        this.isDevelopment ? error.details : undefined
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('database') || error.message.includes('connection')) {
        return this.createFailureResult(
          AuthErrorCode.DATABASE_ERROR,
          'Database connection error'
        );
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createFailureResult(
          AuthErrorCode.NETWORK_ERROR,
          'Network connection error'
        );
      }
    }

    // Default error
    return this.createFailureResult(
      AuthErrorCode.DATABASE_ERROR,
      'An unexpected error occurred',
      this.isDevelopment ? { originalError: error } : undefined
    );
  }

  /**
   * Map AppError codes to AuthError codes
   */
  private mapAppErrorToAuthError(errorCode: ErrorCode): AuthErrorCode {
    switch (errorCode) {
      case ErrorCode.VALIDATION_ERROR:
        return AuthErrorCode.VALIDATION_ERROR;
      case ErrorCode.UNAUTHORIZED:
        return AuthErrorCode.INVALID_CREDENTIALS;
      case ErrorCode.DATABASE_ERROR:
        return AuthErrorCode.DATABASE_ERROR;
      case ErrorCode.NETWORK_ERROR:
        return AuthErrorCode.NETWORK_ERROR;
      default:
        return AuthErrorCode.DATABASE_ERROR;
    }
  }

  /**
   * Get localized error message
   */
  private getLocalizedMessage(code: AuthErrorCode, locale: string = 'en'): string {
    const messages = ERROR_MESSAGES[code];
    if (!messages) return '';
    
    return messages[locale as keyof typeof messages] || messages.en;
  }

  /**
   * Get service status and configuration info
   */
  public getServiceInfo(): {
    hasJwtSecret: boolean;
    hasUserRepository: boolean;
    isDevelopment: boolean;
    repositoryInfo: any;
  } {
    return {
      hasJwtSecret: !!this.jwtSecret,
      hasUserRepository: !!this.userRepository,
      isDevelopment: this.isDevelopment,
      repositoryInfo: this.userRepository?.getConnectionInfo()
    };
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();