import {Env} from '../types';
import {createJWT, hashPassword} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'
]

export async function handleRegister(request: Request, env: Env): Promise<any> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    logWithTimestamp('start register');
    logWithTimestamp('Database:', env.DB.toString());

    try {
        const {name, email, password, googleToken} = await request.json() as any;

        // 检查必要字段
        if (!name || !email || (!password && !googleToken)) {
            return new Promise((resolve) => resolve(new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            })));
        }

        // 检查邮箱是否已存在
        const existingUser = await env.DB.prepare('SELECT email FROM users WHERE email = ?')
            .bind(email)
            .first();

        if (existingUser) {
            return new Promise((resolve) => resolve(new Response('Email already exists', {
                status: 409,
                headers: corsHeaders,
            })));
        }

        // Google 注册验证
        if (googleToken) {
            try {
                // 验证 Google token
                const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {Authorization: `Bearer ${googleToken}`},
                });

                if (!googleUserResponse.ok) {
                    return new Promise((resolve) => resolve(new Response('Invalid Google token', {
                        status: 401,
                        headers: corsHeaders,
                    })));
                }

                const googleUser = await googleUserResponse.json() as any;

                // 验证邮箱是否匹配
                if (googleUser.email !== email) {
                    return new Promise((resolve) => resolve(new Response('Email mismatch', {
                        status: 401,
                        headers: corsHeaders,
                    })));
                }
            } catch (error) {
                logWithTimestamp('Google token verification error:', error);
                return new Promise((resolve) => resolve(new Response('Google authentication failed', {
                    status: 401,
                    headers: corsHeaders,
                })));
            }
        }

        // 处理密码
        const hashedPassword = password ? await hashPassword(password) : null;

        // 插入用户数据
        const result = await env.DB.prepare(
            'INSERT INTO users (name, email, password, is_google_user) VALUES (?, ?, ?, ?)'
        )
            .bind(name, email, hashedPassword, googleToken ? 1 : 0)
            .run();

        // 获取新插入的用户ID
        const userId = result.meta.last_row_id;

        // 创建JWT token
        const token = await createJWT({userId, username: name}, env.JWT_SECRET);

        const userInfo = {
            id: userId,
            name,
            email,
            isGoogleUser: !!googleToken
        };

        return new Promise((resolve) => resolve(new Response(JSON.stringify({
            message: 'User registered successfully',
            token,
            user: userInfo
        }), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        })));
    } catch (error) {
        console.error('Registration error:', error);
        return new Promise((resolve) => resolve(new Response('Error registering user', {
            status: 500,
            headers: corsHeaders,
        })));
    }
}