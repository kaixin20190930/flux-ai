import { NextRequest, NextResponse } from 'next/server';
import { GenerationHistoryDAO } from '@/utils/dao';
import { ErrorHandler, ValidationUtils } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { verifyJWT } from '@/utils/auth';
import { Env } from '@/worker/types';

// Helper function to get user ID from token
async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    throw new AppErrorClass({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
      timestamp: new Date()
    });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET as string;
    const decoded = await verifyJWT(token, jwtSecret);
    return decoded.userId;
  } catch (error) {
    throw new AppErrorClass({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Invalid or expired token',
      timestamp: new Date()
    });
  }
}

// Helper function to create environment object
function createEnv(request: NextRequest): Env {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? (request as any).cf?.d1 : undefined,
    JWT_SECRET: process.env.JWT_SECRET as string,
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}

// 重新生成图像
export async function POST(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取请求体
    const body = await request.json();
    const { id, modifiedParameters } = body as { id: string; modifiedParameters: any };
    
    if (!id || !ValidationUtils.validateUUID(id)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid history ID',
        timestamp: new Date()
      });
    }
    
    // 获取历史记录
    const env = createEnv(request);
    const dao = new GenerationHistoryDAO(env);
    const item = await dao.findById(id);
    
    if (!item) {
      throw new AppErrorClass({
        code: ErrorCode.HISTORY_NOT_FOUND,
        message: 'History record not found',
        timestamp: new Date()
      });
    }
    
    // 验证用户权限
    if (item.userId !== userId) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: 'You do not have permission to access this record',
        timestamp: new Date()
      });
    }
    
    // 准备生成参数
    const regenerationParams = {
      prompt: item.prompt,
      model: item.model,
      parameters: {
        ...item.parameters,
        // 如果提供了修改的参数，则覆盖原始参数
        ...(modifiedParameters || {})
      }
    };
    
    // 这里我们只返回参数，实际生成会由前端调用生成API
    return NextResponse.json({
      success: true,
      regenerationParams
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}