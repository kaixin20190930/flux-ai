import { NextRequest, NextResponse } from 'next/server';
import { ImageSearchDAO } from '@/utils/dao';
import { ErrorHandler } from '@/utils/errorHandler';
import { verifyJWT } from '@/utils/auth';
import { validateAndConsumePoints, getToolPoints, getPointsErrorMessage, validateToolAccess } from '@/utils/pointsSystem';
import ToolsConfigManager from '@/config/tools';
import ToolUsageManager from '@/utils/toolUsage';
import { ImageSearchAPIFactory } from '@/utils/externalImageAPIs';

// Helper function to create environment object
function createEnv(request: NextRequest): { DB: any; 'DB-DEV': any; JWT_SECRET: string; ENVIRONMENT: 'development' | 'production' } {
  return {
    DB: request.nextUrl.hostname === 'localhost' ? undefined : (request as any).cf?.d1,
    'DB-DEV': request.nextUrl.hostname === 'localhost' ? (request as any).cf?.d1 : undefined,
    JWT_SECRET: process.env.JWT_SECRET as string,
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  };
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const body: { 
      query?: string; 
      imageUrl?: string; 
      searchType: 'text' | 'image'; 
      filters: any 
    } = await request.json();
    const { query, imageUrl, searchType, filters } = body;
    
    // 简单的认证检查
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '需要登录才能使用搜索功能' } },
        { status: 401 }
      );
    }
    
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: '服务器配置错误' } },
        { status: 500 }
      );
    }
    
    // 验证JWT token
    let userId: string;
    try {
      const decoded = await verifyJWT(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '登录状态已过期，请重新登录' } },
        { status: 401 }
      );
    }
    
    // 验证搜索参数
    if (searchType === 'text' && !query?.trim()) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '请输入搜索关键词' } },
        { status: 400 }
      );
    }
    
    if (searchType === 'image' && !imageUrl) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '请提供搜索图片' } },
        { status: 400 }
      );
    }
    
    // 调用搜索API
    let searchResults;
    let provider;
    let searchQuery;
    
    try {
      if (searchType === 'text') {
        const api = ImageSearchAPIFactory.getTextSearchAPI();
        searchResults = await api.searchText(query!, filters);
        provider = api.name.toLowerCase();
        searchQuery = query!;
      } else {
        const api = ImageSearchAPIFactory.getImageSearchAPI();
        if (!api.searchImage) {
          throw new Error('图片搜索功能暂时不可用');
        }
        searchResults = await api.searchImage(imageUrl!, filters);
        provider = api.name.toLowerCase();
        searchQuery = '图片搜索';
      }
    } catch (searchError) {
      console.error('Search API error:', searchError);
      return NextResponse.json(
        { error: { code: 'SEARCH_FAILED', message: '搜索服务暂时不可用，请稍后重试' } },
        { status: 503 }
      );
    }
    
    // 保存搜索历史（可选，如果数据库可用）
    try {
      const env = createEnv(request);
      const searchDao = new ImageSearchDAO(env);
      
      const searchId = await searchDao.createSearchHistory(
        userId,
        searchQuery,
        searchType,
        imageUrl || undefined,
        provider,
        searchResults.results.length,
        filters
      );
      
      // 保存搜索结果
      await searchDao.saveSearchResults(
        searchResults.results.map((result: any) => ({
          id: crypto.randomUUID(),
          searchId,
          imageUrl: result.urls?.regular || result.imageUrl,
          thumbnailUrl: result.urls?.thumb || result.thumbnailUrl,
          sourceUrl: result.links?.html || result.sourceUrl,
          title: result.description || result.alt_description || result.title,
          description: result.user ? `Photo by ${result.user.name}` : result.description,
          saved: false
        }))
      );
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
      // 数据库错误不影响搜索结果返回
    }
    
    // 返回搜索结果
    return NextResponse.json({
      results: searchResults.results.map((result: any) => ({
        id: result.id || crypto.randomUUID(),
        searchId: 'current-search',
        imageUrl: result.urls?.regular || result.imageUrl,
        thumbnailUrl: result.urls?.thumb || result.thumbnailUrl,
        sourceUrl: result.links?.html || result.sourceUrl,
        title: result.description || result.alt_description || result.title || '未命名图片',
        description: result.user ? `Photo by ${result.user.name}` : (result.description || '无描述'),
        createdAt: new Date(),
        saved: false
      })),
      total: searchResults.total || searchResults.results.length,
      pointsConsumed: 1, // 简化的点数消费
      remainingPoints: 999 // 简化的剩余点数
    });
    
  } catch (error) {
    console.error('Image search API error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}