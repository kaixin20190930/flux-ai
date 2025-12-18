import {Env} from '../types';
import {createJWT, hashPassword} from '../utils/auth';
import {logWithTimestamp} from "../utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com',
    'https://2932-2409-8924-873-a935-8da0-94be-fcf3-d0c7.ngrok-free.app'
]

export async function handleRegister(request: Request, env: Env): Promise<any> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    const db = env.DB || env['DB-DEV'];
    if (!db) {
        throw new Error('No D1 database binding found!');
    }


    logWithTimestamp('start register');
    logWithTimestamp('Database:', db.toString());

    try {
        const {name, email, password, googleToken} = await request.json() as any;

        // 检查必要字段
        if (!name || !email) {
            return new Promise((resolve) => resolve(new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            })));
        }

        // 检查邮箱是否已存在
        const existingUser = await db.prepare('SELECT email FROM users WHERE email = ?')
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
        let hashedPassword;
        if (googleToken && !password) {
            // 生成随机密码
            const randomPassword = crypto.randomUUID().toString();
            hashedPassword = await hashPassword(randomPassword);
        } else if (password) {
            hashedPassword = await hashPassword(password);
        } else {
            return new Promise((resolve) => resolve(new Response('Password is required for non-Google registration', {
                status: 400,
                headers: corsHeaders,
            })));
        }
        // 插入用户数据（赠送 3 积分）
        const result = await db.prepare(
            'INSERT INTO users (name, email, password, is_google_user, points) VALUES (?, ?, ?, ?, 3)'
        )
            .bind(name, email, hashedPassword, googleToken ? 1 : 0)
            .run();

        // 获取新插入的用户ID
        const userId = result.meta.last_row_id;
        
        // 记录注册赠送积分的交易
        await db.prepare(`
            INSERT INTO transactions (id, user_id, type, amount, balance_before, balance_after, reason)
            VALUES (?, ?, 'register_bonus', 3, 0, 3, 'Registration bonus')
        `).bind(crypto.randomUUID(), userId).run();
        
        logWithTimestamp('New user registered with 3 points:', { userId, email });

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
