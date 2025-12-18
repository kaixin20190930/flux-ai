import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/utils/authUtils';

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const result: any = {
    timestamp: new Date().toISOString(),
    cookies: {},
    jwt_secret_exists: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET?.length || 0,
  };

  try {
    // 检查所有cookies
    const cookies = request.cookies.getAll();
    cookies.forEach((cookie) => {
      result.cookies[cookie.name] = {
        value: cookie.value.substring(0, 20) + '...', // 只显示前20个字符
        length: cookie.value.length
      };
    });

    // 检查token cookie
    const token = request.cookies.get('token')?.value;
    result.token_exists = !!token;
    result.token_length = token?.length || 0;

    if (token && process.env.JWT_SECRET) {
      try {
        const user = await getUserFromCookie(request, process.env.JWT_SECRET);
        result.user_from_token = user ? {
          userId: user.userId,
          email: user.email,
          name: user.name
        } : null;
        result.auth_success = !!user;
      } catch (error) {
        result.auth_error = error instanceof Error ? error.message : String(error);
        result.auth_success = false;
      }
    }

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(result);
}