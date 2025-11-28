import { NextRequest, NextResponse } from 'next/server';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { logWithTimestamp } from '@/utils/logUtils';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    logWithTimestamp('Logout API called');

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // 清除token cookie - 确保清除所有可能的cookie设置
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0) // 设置为过期
    });

    // Also clear non-httpOnly cookie for client-side access
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0)
    });

    logWithTimestamp('Logout successful');
    return response;

  } catch (error) {
    logWithTimestamp('Logout error:', error);
    
    // Handle unexpected errors
    const authError = authErrorHandler.handleAuthError(error, 'logout-api');
    
    return NextResponse.json(
      authErrorHandler.formatForResponse(authError),
      { status: 500 }
    );
  }
}