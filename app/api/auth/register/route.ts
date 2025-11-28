import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/utils/authenticationService';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { userRepository } from '@/utils/userRepository';
import { logWithTimestamp } from '@/utils/logUtils';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

// Initialize authentication service
const authService = new AuthenticationService(
  userRepository,
  process.env.JWT_SECRET
);

export async function POST(request: NextRequest) {
  try {
    logWithTimestamp('Registration API called');

    const body = await request.json();
    const { name, email, password } = body as { name: string; email: string; password: string };

    // Basic input validation
    if (!name || !email || !password) {
      const error = authErrorHandler.createEnhancedError(
        'VALIDATION_ERROR' as any,
        new Error('Name, email and password are required'),
        'register-input-validation'
      );
      
      return NextResponse.json(
        authErrorHandler.formatForResponse(error),
        { status: 400 }
      );
    }

    // Additional validation
    if (name.trim().length < 2) {
      const error = authErrorHandler.createEnhancedError(
        'VALIDATION_ERROR' as any,
        new Error('Name must be at least 2 characters long'),
        'register-name-validation'
      );
      
      return NextResponse.json(
        authErrorHandler.formatForResponse(error),
        { status: 400 }
      );
    }

    if (password.length < 6) {
      const error = authErrorHandler.createEnhancedError(
        'VALIDATION_ERROR' as any,
        new Error('Password must be at least 6 characters long'),
        'register-password-validation'
      );
      
      return NextResponse.json(
        authErrorHandler.formatForResponse(error),
        { status: 400 }
      );
    }

    // Attempt registration using authentication service
    const result = await authService.registerUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isGoogleUser: false
    });

    if (result.success && result.token && result.user) {
      logWithTimestamp('Registration successful for user:', result.user.id);
      
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
      // Handle registration failure
      logWithTimestamp('Registration failed:', result.error?.code);
      
      let statusCode = 400;
      if (result.error?.code === 'EMAIL_ALREADY_EXISTS') {
        statusCode = 409;
      } else if (result.error?.code === 'VALIDATION_ERROR') {
        statusCode = 400;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || 'REGISTRATION_FAILED',
            message: result.error?.message || 'Registration failed',
            timestamp: new Date().toISOString()
          }
        },
        { status: statusCode }
      );
    }

  } catch (error) {
    logWithTimestamp('Registration API error:', error);
    
    // Handle unexpected errors
    const authError = authErrorHandler.handleAuthError(error, 'register-api');
    
    return NextResponse.json(
      authErrorHandler.formatForResponse(authError),
      { status: 500 }
    );
  }
}