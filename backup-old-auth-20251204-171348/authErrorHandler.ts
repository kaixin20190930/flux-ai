import { AuthError, AuthErrorCode } from './authenticationService';
import { logWithTimestamp } from './logUtils';

// Multi-language error messages
const ERROR_MESSAGES: Record<AuthErrorCode, Record<string, string>> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    en: 'Invalid email or password. Please check your credentials and try again.',
    zh: '邮箱或密码错误，请检查后重试。',
    es: 'Email o contraseña inválidos. Por favor verifica tus credenciales e intenta de nuevo.',
    fr: 'Email ou mot de passe invalide. Veuillez vérifier vos identifiants et réessayer.',
    de: 'Ungültige E-Mail oder Passwort. Bitte überprüfen Sie Ihre Anmeldedaten und versuchen Sie es erneut.',
    ja: 'メールアドレスまたはパスワードが正しくありません。認証情報を確認してもう一度お試しください。'
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    en: 'No account found with this email address. Please check your email or create a new account.',
    zh: '未找到该邮箱对应的账户，请检查邮箱地址或创建新账户。',
    es: 'No se encontró una cuenta con esta dirección de email. Por favor verifica tu email o crea una nueva cuenta.',
    fr: 'Aucun compte trouvé avec cette adresse email. Veuillez vérifier votre email ou créer un nouveau compte.',
    de: 'Kein Konto mit dieser E-Mail-Adresse gefunden. Bitte überprüfen Sie Ihre E-Mail oder erstellen Sie ein neues Konto.',
    ja: 'このメールアドレスに対応するアカウントが見つかりません。メールアドレスを確認するか、新しいアカウントを作成してください。'
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    en: 'An account with this email already exists. Please use a different email or try logging in.',
    zh: '该邮箱已被注册，请使用其他邮箱或尝试登录。',
    es: 'Ya existe una cuenta con este email. Por favor usa un email diferente o intenta iniciar sesión.',
    fr: 'Un compte avec cet email existe déjà. Veuillez utiliser un email différent ou essayer de vous connecter.',
    de: 'Ein Konto mit dieser E-Mail existiert bereits. Bitte verwenden Sie eine andere E-Mail oder versuchen Sie sich anzumelden.',
    ja: 'このメールアドレスのアカウントは既に存在します。別のメールアドレスを使用するか、ログインをお試しください。'
  },
  [AuthErrorCode.GOOGLE_AUTH_FAILED]: {
    en: 'Google authentication failed. Please try again or use email login.',
    zh: 'Google登录失败，请重试或使用邮箱登录。',
    es: 'La autenticación de Google falló. Por favor intenta de nuevo o usa el login con email.',
    fr: 'L\'authentification Google a échoué. Veuillez réessayer ou utiliser la connexion par email.',
    de: 'Google-Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut oder verwenden Sie die E-Mail-Anmeldung.',
    ja: 'Google認証に失敗しました。もう一度お試しいただくか、メールでのログインをご利用ください。'
  },
  [AuthErrorCode.TOKEN_EXPIRED]: {
    en: 'Your session has expired. Please log in again to continue.',
    zh: '会话已过期，请重新登录以继续。',
    es: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo para continuar.',
    fr: 'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
    de: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an, um fortzufahren.',
    ja: 'セッションが期限切れです。続行するには再度ログインしてください。'
  },
  [AuthErrorCode.TOKEN_INVALID]: {
    en: 'Invalid authentication token. Please log in again.',
    zh: '无效的认证令牌，请重新登录。',
    es: 'Token de autenticación inválido. Por favor inicia sesión de nuevo.',
    fr: 'Token d\'authentification invalide. Veuillez vous reconnecter.',
    de: 'Ungültiger Authentifizierungstoken. Bitte melden Sie sich erneut an.',
    ja: '無効な認証トークンです。再度ログインしてください。'
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    en: 'Database connection error. Please try again in a few moments.',
    zh: '数据库连接错误，请稍后重试。',
    es: 'Error de conexión a la base de datos. Por favor intenta de nuevo en unos momentos.',
    fr: 'Erreur de connexion à la base de données. Veuillez réessayer dans quelques instants.',
    de: 'Datenbankverbindungsfehler. Bitte versuchen Sie es in wenigen Augenblicken erneut.',
    ja: 'データベース接続エラーです。しばらくしてからもう一度お試しください。'
  },
  [AuthErrorCode.NETWORK_ERROR]: {
    en: 'Network connection error. Please check your internet connection and try again.',
    zh: '网络连接错误，请检查网络连接后重试。',
    es: 'Error de conexión de red. Por favor verifica tu conexión a internet e intenta de nuevo.',
    fr: 'Erreur de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.',
    de: 'Netzwerkverbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    ja: 'ネットワーク接続エラーです。インターネット接続を確認してもう一度お試しください。'
  },
  [AuthErrorCode.CONFIGURATION_ERROR]: {
    en: 'System configuration error. Please contact support if this persists.',
    zh: '系统配置错误，如果问题持续存在请联系技术支持。',
    es: 'Error de configuración del sistema. Por favor contacta soporte si esto persiste.',
    fr: 'Erreur de configuration système. Veuillez contacter le support si cela persiste.',
    de: 'Systemkonfigurationsfehler. Bitte kontaktieren Sie den Support, wenn dies anhält.',
    ja: 'システム設定エラーです。問題が続く場合はサポートにお問い合わせください。'
  },
  [AuthErrorCode.VALIDATION_ERROR]: {
    en: 'Invalid input data. Please check your information and try again.',
    zh: '输入数据无效，请检查信息后重试。',
    es: 'Datos de entrada inválidos. Por favor verifica tu información e intenta de nuevo.',
    fr: 'Données d\'entrée invalides. Veuillez vérifier vos informations et réessayer.',
    de: 'Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Informationen und versuchen Sie es erneut.',
    ja: '入力データが無効です。情報を確認してもう一度お試しください。'
  },
  [AuthErrorCode.PASSWORD_HASH_ERROR]: {
    en: 'Password processing error. Please try again.',
    zh: '密码处理错误，请重试。',
    es: 'Error de procesamiento de contraseña. Por favor intenta de nuevo.',
    fr: 'Erreur de traitement du mot de passe. Veuillez réessayer.',
    de: 'Passwort-Verarbeitungsfehler. Bitte versuchen Sie es erneut.',
    ja: 'パスワード処理エラーです。もう一度お試しください。'
  },
  [AuthErrorCode.JWT_CREATION_ERROR]: {
    en: 'Authentication token creation failed. Please try logging in again.',
    zh: '认证令牌创建失败，请重新登录。',
    es: 'Falló la creación del token de autenticación. Por favor intenta iniciar sesión de nuevo.',
    fr: 'Échec de la création du token d\'authentification. Veuillez essayer de vous reconnecter.',
    de: 'Erstellung des Authentifizierungstokens fehlgeschlagen. Bitte versuchen Sie sich erneut anzumelden.',
    ja: '認証トークンの作成に失敗しました。再度ログインをお試しください。'
  }
};

// Debug information templates
const DEBUG_TEMPLATES: Record<AuthErrorCode, (details: any) => string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: (details) => 
    `Credential validation failed. Email provided: ${!!details?.email}, Password provided: ${!!details?.password}`,
  
  [AuthErrorCode.USER_NOT_FOUND]: (details) => 
    `User lookup failed for email: ${details?.email || 'unknown'}`,
  
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: (details) => 
    `Duplicate email registration attempt: ${details?.email || 'unknown'}`,
  
  [AuthErrorCode.GOOGLE_AUTH_FAILED]: (details) => 
    `Google OAuth failed. Token present: ${!!details?.hasToken}, Email: ${details?.email || 'unknown'}`,
  
  [AuthErrorCode.TOKEN_EXPIRED]: (details) => 
    `Token expired at: ${details?.expiredAt || 'unknown'}`,
  
  [AuthErrorCode.TOKEN_INVALID]: (details) => 
    `Token validation failed. Reason: ${details?.reason || 'unknown'}`,
  
  [AuthErrorCode.DATABASE_ERROR]: (details) => 
    `Database operation failed: ${details?.operation || 'unknown'}. Error: ${details?.originalError || 'unknown'}`,
  
  [AuthErrorCode.NETWORK_ERROR]: (details) => 
    `Network request failed: ${details?.url || 'unknown'}. Status: ${details?.status || 'unknown'}`,
  
  [AuthErrorCode.CONFIGURATION_ERROR]: (details) => 
    `Configuration missing: ${details?.missingConfig || 'unknown'}`,
  
  [AuthErrorCode.VALIDATION_ERROR]: (details) => 
    `Validation failed for fields: ${Object.keys(details || {}).join(', ')}`,
  
  [AuthErrorCode.PASSWORD_HASH_ERROR]: (details) => 
    `Password hashing failed: ${details?.originalError || 'unknown'}`,
  
  [AuthErrorCode.JWT_CREATION_ERROR]: (details) => 
    `JWT creation failed: ${details?.originalError || 'unknown'}`
};

// User action suggestions
const ACTION_SUGGESTIONS: Record<AuthErrorCode, Record<string, string[]>> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    en: [
      'Double-check your email address for typos',
      'Verify your password is correct',
      'Try using the "Forgot Password" option if available',
      'Ensure Caps Lock is not enabled'
    ],
    zh: [
      '检查邮箱地址是否有拼写错误',
      '确认密码是否正确',
      '如果可用，尝试使用"忘记密码"选项',
      '确保大写锁定键未启用'
    ]
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    en: [
      'Verify the email address is correct',
      'Try creating a new account if you haven\'t registered',
      'Check if you used a different email to register'
    ],
    zh: [
      '确认邮箱地址是否正确',
      '如果尚未注册，尝试创建新账户',
      '检查是否使用了不同的邮箱注册'
    ]
  },
  [AuthErrorCode.GOOGLE_AUTH_FAILED]: {
    en: [
      'Try logging in with email and password instead',
      'Check your Google account permissions',
      'Clear browser cookies and try again',
      'Ensure pop-ups are not blocked'
    ],
    zh: [
      '尝试使用邮箱和密码登录',
      '检查Google账户权限',
      '清除浏览器Cookie后重试',
      '确保弹窗未被阻止'
    ]
  },
  [AuthErrorCode.NETWORK_ERROR]: {
    en: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable VPN if you\'re using one',
      'Try again in a few minutes'
    ],
    zh: [
      '检查网络连接',
      '尝试刷新页面',
      '如果使用VPN，请暂时关闭',
      '几分钟后重试'
    ]
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    en: [
      'Try again in a few moments',
      'Refresh the page and retry',
      'Contact support if the problem persists'
    ],
    zh: [
      '稍后重试',
      '刷新页面后重试',
      '如果问题持续存在，请联系技术支持'
    ]
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    en: [
      'Try logging in instead of registering',
      'Use the "Forgot Password" option if you forgot your password',
      'Check if you already have an account'
    ],
    zh: [
      '尝试登录而不是注册',
      '如果忘记密码，使用"忘记密码"选项',
      '检查是否已有账户'
    ]
  },
  [AuthErrorCode.TOKEN_EXPIRED]: {
    en: [
      'Please log in again',
      'Your session has expired for security reasons'
    ],
    zh: [
      '请重新登录',
      '出于安全考虑，您的会话已过期'
    ]
  },
  [AuthErrorCode.TOKEN_INVALID]: {
    en: [
      'Please log in again',
      'Clear your browser cache and cookies',
      'Try using a different browser'
    ],
    zh: [
      '请重新登录',
      '清除浏览器缓存和Cookie',
      '尝试使用其他浏览器'
    ]
  },
  [AuthErrorCode.CONFIGURATION_ERROR]: {
    en: [
      'Contact support',
      'This is a system configuration issue'
    ],
    zh: [
      '联系技术支持',
      '这是系统配置问题'
    ]
  },
  [AuthErrorCode.VALIDATION_ERROR]: {
    en: [
      'Check your input for errors',
      'Ensure all required fields are filled',
      'Follow the format requirements'
    ],
    zh: [
      '检查输入是否有错误',
      '确保所有必填字段已填写',
      '遵循格式要求'
    ]
  },
  [AuthErrorCode.PASSWORD_HASH_ERROR]: {
    en: [
      'Try again',
      'Contact support if the problem persists'
    ],
    zh: [
      '重试',
      '如果问题持续，请联系技术支持'
    ]
  },
  [AuthErrorCode.JWT_CREATION_ERROR]: {
    en: [
      'Try logging in again',
      'Contact support if the problem persists'
    ],
    zh: [
      '尝试重新登录',
      '如果问题持续，请联系技术支持'
    ]
  }
};

export class AuthErrorHandler {
  private isDevelopment: boolean;
  private defaultLocale: string;

  constructor(isDevelopment: boolean = false, defaultLocale: string = 'en') {
    this.isDevelopment = isDevelopment;
    this.defaultLocale = defaultLocale;
  }

  /**
   * Handle authentication error and return standardized error response
   */
  handleAuthError(error: any, context: string): AuthError {
    logWithTimestamp(`Auth error in ${context}:`, error);

    // If it's already an AuthError, return it
    if (this.isAuthError(error)) {
      return error;
    }

    // Determine error code based on error type and message
    const errorCode = this.determineErrorCode(error, context);
    
    // Extract details for debugging
    const details = this.extractErrorDetails(error);

    // Create standardized error
    const authError: AuthError = {
      code: errorCode,
      message: this.getUserMessage(errorCode, this.defaultLocale),
      details: this.isDevelopment ? details : undefined,
      debugInfo: this.isDevelopment ? this.generateDebugInfo(errorCode, details, context) : undefined
    };

    return authError;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(errorCode: string, locale: string = 'en'): string {
    const messages = ERROR_MESSAGES[errorCode as AuthErrorCode];
    if (!messages) {
      return ERROR_MESSAGES[AuthErrorCode.DATABASE_ERROR][locale] || 
             ERROR_MESSAGES[AuthErrorCode.DATABASE_ERROR].en;
    }

    return messages[locale] || messages.en;
  }

  /**
   * Get action suggestions for the user
   */
  getActionSuggestions(errorCode: string, locale: string = 'en'): string[] {
    const suggestions = ACTION_SUGGESTIONS[errorCode as AuthErrorCode];
    if (!suggestions) {
      return [];
    }

    return suggestions[locale] || suggestions.en || [];
  }

  /**
   * Log debug information (development only)
   */
  logDebugInfo(error: any, context: any): void {
    if (!this.isDevelopment) {
      return;
    }

    console.group('🔍 Authentication Debug Information');
    console.log('Context:', context);
    console.log('Error:', error);
    console.log('Stack trace:', error?.stack);
    console.log('Timestamp:', new Date().toISOString());
    
    if (context && typeof context === 'object') {
      console.log('Additional context:', context);
    }
    
    console.groupEnd();
  }

  /**
   * Create enhanced error response with suggestions
   */
  createEnhancedError(
    errorCode: AuthErrorCode,
    originalError?: any,
    context?: string,
    locale: string = 'en'
  ): AuthError {
    const message = this.getUserMessage(errorCode, locale);
    const suggestions = this.getActionSuggestions(errorCode, locale);
    
    const authError: AuthError = {
      code: errorCode,
      message,
      details: this.isDevelopment ? {
        suggestions,
        originalError: originalError?.message,
        context
      } : undefined,
      debugInfo: this.isDevelopment ? this.generateDebugInfo(
        errorCode,
        { originalError, context },
        context || 'unknown'
      ) : undefined
    };

    if (this.isDevelopment) {
      this.logDebugInfo(originalError, { errorCode, context, suggestions });
    }

    return authError;
  }

  /**
   * Check if error is already an AuthError
   */
  private isAuthError(error: any): error is AuthError {
    return error && 
           typeof error === 'object' && 
           'code' in error && 
           'message' in error &&
           Object.values(AuthErrorCode).includes(error.code);
  }

  /**
   * Determine error code from error object
   */
  private determineErrorCode(error: any, context: string): AuthErrorCode {
    if (!error) {
      return AuthErrorCode.DATABASE_ERROR;
    }

    // Check error message patterns
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('invalid credentials') || message.includes('authentication failed')) {
      return AuthErrorCode.INVALID_CREDENTIALS;
    }
    
    if (message.includes('user not found') || message.includes('no user')) {
      return AuthErrorCode.USER_NOT_FOUND;
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return AuthErrorCode.EMAIL_ALREADY_EXISTS;
    }
    
    if (message.includes('google') && message.includes('failed')) {
      return AuthErrorCode.GOOGLE_AUTH_FAILED;
    }
    
    if (message.includes('expired') || message.includes('token expired')) {
      return AuthErrorCode.TOKEN_EXPIRED;
    }
    
    if (message.includes('invalid token') || message.includes('token invalid')) {
      return AuthErrorCode.TOKEN_INVALID;
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return AuthErrorCode.DATABASE_ERROR;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return AuthErrorCode.NETWORK_ERROR;
    }
    
    if (message.includes('configuration') || message.includes('config')) {
      return AuthErrorCode.CONFIGURATION_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid input')) {
      return AuthErrorCode.VALIDATION_ERROR;
    }
    
    if (message.includes('password') && message.includes('hash')) {
      return AuthErrorCode.PASSWORD_HASH_ERROR;
    }
    
    if (message.includes('jwt') || message.includes('token creation')) {
      return AuthErrorCode.JWT_CREATION_ERROR;
    }

    // Check context for additional clues
    if (context.includes('google') || context.includes('oauth')) {
      return AuthErrorCode.GOOGLE_AUTH_FAILED;
    }
    
    if (context.includes('login') || context.includes('password')) {
      return AuthErrorCode.INVALID_CREDENTIALS;
    }
    
    if (context.includes('register') || context.includes('signup')) {
      return AuthErrorCode.VALIDATION_ERROR;
    }

    // Default to database error
    return AuthErrorCode.DATABASE_ERROR;
  }

  /**
   * Extract error details for debugging
   */
  private extractErrorDetails(error: any): any {
    if (!error) {
      return null;
    }

    const details: any = {
      message: error.message,
      name: error.name,
      type: typeof error
    };

    // Add stack trace in development
    if (this.isDevelopment && error.stack) {
      details.stack = error.stack;
    }

    // Add additional properties
    if (error.code) details.code = error.code;
    if (error.status) details.status = error.status;
    if (error.details) details.originalDetails = error.details;

    return details;
  }

  /**
   * Generate debug information
   */
  private generateDebugInfo(errorCode: AuthErrorCode, details: any, context: string): any {
    const debugTemplate = DEBUG_TEMPLATES[errorCode];
    const debugMessage = debugTemplate ? debugTemplate(details) : 'Unknown error occurred';

    return {
      errorCode,
      context,
      debugMessage,
      timestamp: new Date().toISOString(),
      details,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  /**
   * Format error for API response
   */
  formatForResponse(error: AuthError): {
    success: false;
    error: {
      code: string;
      message: string;
      suggestions?: string[];
      timestamp: string;
    };
  } {
    const suggestions = this.getActionSuggestions(error.code, this.defaultLocale);
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Set default locale
   */
  setDefaultLocale(locale: string): void {
    this.defaultLocale = locale;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return ['en', 'zh', 'es', 'fr', 'de', 'ja'];
  }
}

// Export singleton instance
export const authErrorHandler = new AuthErrorHandler(
  process.env.NODE_ENV === 'development',
  'en'
);