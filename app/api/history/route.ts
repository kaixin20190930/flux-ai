import { NextRequest, NextResponse } from 'next/server';
import { GenerationHistoryDAO, ShareRecordDAO } from '@/utils/dao';
import { ErrorHandler, ValidationUtils } from '@/utils/errorHandler';
import { AppErrorClass, ErrorCode, HistorySearchRequest } from '@/types/database';
import { Env } from '@/worker/types';
import { auth } from '@/lib/auth';

// Helper function to get user ID from NextAuth session
async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new AppErrorClass({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
      timestamp: new Date()
    });
  }
  
  return session.user.id;
}

// Helper function to create environment object
function createEnv(request: NextRequest): any {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? (request as any).cf?.d1 : undefined,
    JWT_SECRET: process.env.JWT_SECRET as string,
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}

// 获取用户历史记录列表
export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function GET(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('query') || undefined;
    const model = searchParams.get('model') || undefined;
    
    // 日期范围处理
    let dateRange: [Date, Date] | undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      dateRange = [new Date(startDate), new Date(endDate)];
    }
    
    // 标签处理
    let tags: string[] | undefined;
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      tags = tagsParam.split(',');
    }
    
    // 验证分页参数
    const { page: validPage, limit: validLimit } = ValidationUtils.validatePagination(page, limit);
    
    // 构建搜索请求
    const searchRequest: HistorySearchRequest = {
      query,
      model,
      dateRange,
      tags,
      page: validPage,
      limit: validLimit
    };
    
    // 获取历史记录
    const env = createEnv(request);
    const dao = new GenerationHistoryDAO(env);
    const result = await dao.findByUserId(userId, searchRequest);
    
    return NextResponse.json(result);
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 获取单个历史记录详情
export async function POST(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取请求体
    const body = await request.json();
    const { id } = body as { id: string };
    
    if (!id || !ValidationUtils.validateUUID(id)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid history ID',
        timestamp: new Date()
      });
    }
    
    // 获取历史记录详情
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
    
    // 获取相关记录（同一模型的其他记录）
    const relatedItems = await dao.findByUserId(userId, {
      model: item.model,
      limit: 5,
      page: 1
    });
    
    // 过滤掉当前记录
    const filteredRelatedItems = relatedItems.items.filter(related => related.id !== id);
    
    return NextResponse.json({
      item,
      relatedItems: filteredRelatedItems
    });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 更新历史记录（如标签、公开状态等）
export async function PUT(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取请求体
    const body = await request.json();
    const { id, tags, isPublic } = body as { id: string; tags: string[]; isPublic: boolean };
    
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
        message: 'You do not have permission to update this record',
        timestamp: new Date()
      });
    }
    
    // 更新记录
    await dao.update(id, {
      tags: Array.isArray(tags) ? tags : item.tags,
      isPublic: typeof isPublic === 'boolean' ? isPublic : item.isPublic
    });
    
    // 获取更新后的记录
    const updatedItem = await dao.findById(id);
    
    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 删除历史记录
export async function DELETE(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取请求参数
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // 批量删除的ID列表
    
    const env = createEnv(request);
    const dao = new GenerationHistoryDAO(env);
    
    // 批量删除
    if (ids) {
      const idArray = ids.split(',');
      if (!idArray.every(ValidationUtils.validateUUID)) {
        throw new AppErrorClass({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid history IDs',
          timestamp: new Date()
        });
      }
      
      const results = await Promise.all(
        idArray.map(async (itemId) => {
          try {
            await dao.delete(itemId, userId);
            return { id: itemId, success: true };
          } catch (error) {
            return { id: itemId, success: false, error: (error as Error).message };
          }
        })
      );
      
      return NextResponse.json({ results });
    }
    
    // 单个删除
    if (!id || !ValidationUtils.validateUUID(id)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid history ID',
        timestamp: new Date()
      });
    }
    
    await dao.delete(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}

// 批量操作历史记录（下载、分享等）
export async function PATCH(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = await getUserIdFromRequest(request);
    
    // 获取请求体
    const body = await request.json();
    const { operation, ids } = body as { operation: string; ids: string[] };
    
    if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid operation or IDs',
        timestamp: new Date()
      });
    }
    
    if (!ids.every(ValidationUtils.validateUUID)) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid history IDs',
        timestamp: new Date()
      });
    }
    
    const env = createEnv(request);
    const dao = new GenerationHistoryDAO(env);
    
    // 验证所有ID都属于当前用户
    const items = await Promise.all(ids.map(id => dao.findById(id)));
    const invalidItems = items.filter((item, index) => !item || item.userId !== userId);
    
    if (invalidItems.length > 0) {
      throw new AppErrorClass({
        code: ErrorCode.UNAUTHORIZED,
        message: 'You do not have permission to access some of these records',
        timestamp: new Date()
      });
    }
    
    // 过滤掉无效的项
    const validItems = items.filter(item => item !== null) as any[];
    
    // 执行批量操作
    switch (operation) {
      case 'download':
        // 更新下载计数
        await Promise.all(validItems.map(item => dao.updateDownloadCount(item.id)));
        
        // 返回下载URL列表
        return NextResponse.json({
          success: true,
          urls: validItems.map(item => item.imageUrl)
        });
        
      case 'share':
        const { platform } = body as { platform: string };
        if (!platform) {
          throw new AppErrorClass({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Platform is required for share operation',
            timestamp: new Date()
          });
        }
        
        // 记录分享操作
        const shareDao = new ShareRecordDAO(env);
        await Promise.all(validItems.map(item => 
          shareDao.create({
            generationId: item.id,
            platform,
            userId
          })
        ));
        
        return NextResponse.json({
          success: true,
          items: validItems.map(item => ({
            id: item.id,
            imageUrl: item.imageUrl,
            prompt: item.prompt
          }))
        });
        
      case 'tag':
        const { tags } = body as { tags: string[] };
        if (!tags || !Array.isArray(tags)) {
          throw new AppErrorClass({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Tags are required for tag operation',
            timestamp: new Date()
          });
        }
        
        // 更新标签
        await Promise.all(validItems.map(item => 
          dao.update(item.id, {
            tags: Array.from(new Set([...item.tags, ...tags])) // 合并并去重
          })
        ));
        
        return NextResponse.json({
          success: true,
          count: validItems.length
        });
        
      case 'untag':
        const { removeTags } = body as { removeTags: string[] };
        if (!removeTags || !Array.isArray(removeTags)) {
          throw new AppErrorClass({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Tags are required for untag operation',
            timestamp: new Date()
          });
        }
        
        // 移除标签
        await Promise.all(validItems.map(item => 
          dao.update(item.id, {
            tags: item.tags.filter((tag: string) => !removeTags.includes(tag))
          })
        ));
        
        return NextResponse.json({
          success: true,
          count: validItems.length
        });
        
      default:
        throw new AppErrorClass({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Unsupported operation',
          timestamp: new Date()
        });
    }
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    return ErrorHandler.createResponse(appError);
  }
}