import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/utils/authenticationService';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { userRepository } from '@/utils/userRepository';
import { logWithTimestamp } from '@/utils/logUtils';

export const dynamic = 'force-dynamic'

// 只在生产环境使用 Edge Runtime
export const runtime = process.env.NODE_ENV === 'production' ? 'edge' : 'nodejs';

// Initialize authentication service
const authService = new AuthenticationService(
  userRepository,
  process.env.JWT_SECRET
);

export async function POST(request: NextRequest) {
  try {
    logWithTimestamp('Login API called');

    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    // Basic input validation
    if (!email || !password) {
      const error = authErrorHandler.createEnhancedError(
        'VALIDATION_ERROR' as any,
        new Error('Email and password are required'),
        'login-input-validation'
      );
      
      return NextResponse.json(
        authErrorHandler.formatForResponse(error),
        { status: 400 }
      );
    }

    // Attempt login using authentication service
    const result = await authService.loginWithPassword(email, password);

    if (result.success && result.token && result.user) {
      logWithTimestamp('Login successful for user:', result.user.id);
      
      // Set secure cookie
      const response = NextResponse.json({
        success: true,
        token: result.token,
        user: {
          userId: result.user.id,
          id: result.user.id, // For backward compatibility
          email: result.user.email,
          name: result.user.name,
          points: result.user.points,
          isGoogleUser: result.user.isGoogleUser
        }
      });

      // Set HTTP-only cookie for additional security
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookies.set('token', result.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      return response;
    } else {
      // Handle authentication failure
      logWithTimestamp('Login failed:', result.error?.code);
      
      const statusCode = result.error?.code === 'VALIDATION_ERROR' ? 400 : 401;
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || 'AUTHENTICATION_FAILED',
            message: result.error?.message || 'Authentication failed',
            timestamp: new Date().toISOString()
          }
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    logWithTimestamp('Login API error:', error);
    
    // Handle unexpected errors
    const authError = authErrorHandler.handleAuthError(error, 'login-api');
    
    return NextResponse.json(
      authErrorHandler.formatForResponse(authError),
      { status: 500 }
    );
  }
}