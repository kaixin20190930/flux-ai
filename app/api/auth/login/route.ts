import { NextRequest, NextResponse } from 'next/server';
import { EdgeAuth } from '@/utils/edgeUtils';
// bcrypt replaced with EdgeAuth for Edge Runtime compatibility
import { createJWT } from '@/utils/auth';

// 模拟用户数据库（实际应用中应该使用真实数据库）
const users = [
  {
    id: '1',
    email: 'test@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Test User',
    points: 100
  }
];

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await await EdgeAuth.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 生成JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = await createJWT(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET
    );

    // 返回用户信息和token
    const userData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      points: user.points
    };

    return NextResponse.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}