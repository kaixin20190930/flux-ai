import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/authUtils';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorCode } from '@/types/database';

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const user = await getUserFromRequest(request);
    
    if (!user) {
      const error = ErrorHandler.handle(new Error('Unauthorized'), {
        url: request.url,
        method: request.method
      });
      return ErrorHandler.createResponse(error);
    }

    // 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        points: user.points,
        subscription_type: user.subscription_type,
        // 不返回敏感信息如密码等
      }
    });

  } catch (error) {
    const appError = ErrorHandler.handle(error, {
      url: request.url,
      method: request.method
    });

    return ErrorHandler.createResponse(appError);
  }
}