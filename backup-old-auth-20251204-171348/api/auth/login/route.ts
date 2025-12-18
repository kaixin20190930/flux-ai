import { NextRequest, NextResponse } from 'next/server';
import { createJWT } from '@/utils/auth';
import { EdgeAuth } from '@/utils/edgeUtils';
import { MemoryStore } from '@/utils/memoryStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // 查找用户
    const user = MemoryStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const isValid = await EdgeAuth.verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // 生成JWT
    const token = await createJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        isGoogleUser: user.isGoogleUser
      },
      process.env.JWT_SECRET || 'default-secret-key'
    );

    // 更新最后登录时间
    MemoryStore.updateUser(user.id, { lastLoginAt: new Date() });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        userId: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        isGoogleUser: user.isGoogleUser
      }
    });

    // 设置cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'An error occurred during login' } },
      { status: 500 }
    );
  }
}