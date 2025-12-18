import { NextRequest, NextResponse } from 'next/server';
import { createJWT } from '@/utils/auth';
import { EdgeAuth } from '@/utils/edgeUtils';
import { MemoryStore } from '@/utils/memoryStore';
import { User } from '@/utils/userRepository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name: string; email: string; password: string };
    const { name, email, password } = body;

    // 验证输入
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email and password are required' } },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters long' } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long' } },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = MemoryStore.getUserByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' } },
        { status: 409 }
      );
    }

    // 哈希密码
    const hashedPassword = await EdgeAuth.hashPassword(password);

    // 创建新用户
    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isGoogleUser: false,
      points: 50,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存用户
    MemoryStore.saveUser(newUser);

    // 生成JWT
    const token = await createJWT(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        points: newUser.points,
        isGoogleUser: newUser.isGoogleUser
      },
      process.env.JWT_SECRET || 'default-secret-key'
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        userId: newUser.id,
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        points: newUser.points,
        isGoogleUser: newUser.isGoogleUser
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'An error occurred during registration' } },
      { status: 500 }
    );
  }
}