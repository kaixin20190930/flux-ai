import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createJWT } from '@/utils/auth';

// 模拟用户数据库（实际应用中应该使用真实数据库）
let users = [
  {
    id: '1',
    email: 'test@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Test User',
    points: 100
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as { name: string; email: string; password: string };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = {
      id: String(users.length + 1),
      email,
      password: hashedPassword,
      name,
      points: 50 // 新用户默认50积分
    };

    users.push(newUser);

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
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      JWT_SECRET
    );

    // 返回用户信息和token
    const userData = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      points: newUser.points
    };

    return NextResponse.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}