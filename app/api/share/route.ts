import { NextRequest, NextResponse } from 'next/server';
import { ShareRecordDAO } from '@/utils/dao';
import { ErrorHandler, ValidationUtils } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode, Env } from '@/types/database';
import { getPlatform } from '@/utils/socialPlatforms';
import { getUserFromRequest } from '@/utils/authUtils';

// Helper function to create environment object
function createEnv(request: NextRequest): Env {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    JWT_SECRET: process.env.JWT_SECRET || '',
    ENVIRONMENT: request.nextUrl.hostname === 'localhost' ? 'development' : 'production'
  };
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUserFromRequest(request);
    if (!user) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: '用户未登录',
        timestamp: new Date()
      });
    }

    // 解析请求体
    const body = await request.json();
    const { generationId, platform, description, tags } = body as {
      generationId: string;
      platform: string;
      description?: string;
      tags?: string[];
    };

    // 验证参数
    if (!generationId || !platform) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: '缺少必要参数',
        timestamp: new Date()
      });
    }

    if (!ValidationUtils.validateUUID(generationId)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: '无效的生成记录ID',
        timestamp: new Date()
      });
    }

    // 验证平台是否支持
    const platformConfig = getPlatform(platform);
    if (!platformConfig) {
      throw new AppErrorClass({
        code: ErrorCode.SHARE_PLATFORM_ERROR,
        message: '不支持的社交平台',
        timestamp: new Date()
      });
    }

    // 创建分享记录
    const env = createEnv(request);
    const shareRecordDAO = new ShareRecordDAO(env);
    const shareId = await shareRecordDAO.create({
      generationId,
      platform,
      userId: user.userId
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      shareId,
      timestamp: new Date()
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUserFromRequest(request);
    if (!user) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: '用户未登录',
        timestamp: new Date()
      });
    }

    // 获取查询参数
    const url = new URL(request.url);
    const generationId = url.searchParams.get('generationId');

    // 验证参数
    if (!generationId) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: '缺少必要参数',
        timestamp: new Date()
      });
    }

    if (!ValidationUtils.validateUUID(generationId)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: '无效的生成记录ID',
        timestamp: new Date()
      });
    }

    // 获取分享统计
    const env = createEnv(request);
    const shareRecordDAO = new ShareRecordDAO(env);
    const stats = await shareRecordDAO.getShareStats(generationId);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}