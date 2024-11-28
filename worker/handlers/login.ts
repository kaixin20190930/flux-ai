import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {setCookie} from "@/utils/cookieUtils";

const allowedOrigins = [
    'http://localhost:3000',
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'
]

export async function handleLogin(request: Request, env: Env): Promise<any> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    try {
        const {email, password, googleToken} = await request.json() as any;

        // 检查是否提供了必要的字段
        if (!email || (!password && !googleToken)) {
            return new Promise((resolve) => resolve(new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            })));
        }

        // 查找用户
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first();

        if (!user) {
            return new Promise((resolve) => resolve(new Response('Invalid credentials', {
                status: 401,
                headers: corsHeaders,
            })));
        }

        // Google 登录验证
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
        } else {
            // 原有的密码验证流程
            if (!await verifyPassword(password, user.password as string)) {
                return new Promise((resolve) => resolve(new Response('Invalid credentials', {
                    status: 401,
                    headers: corsHeaders,
                })));
            }
        }

        // 生成 JWT token
        const token = await createJWT({userId: user.id, username: user.name}, env.JWT_SECRET);

        try {
            await verifyJWT(token, env.JWT_SECRET);
            logWithTimestamp('token value is:', token)
            logWithTimestamp('env.JWT_SECRET value is:', env.JWT_SECRET)
            logWithTimestamp('Token verified successfully immediately after creation');
        } catch (error) {
            logWithTimestamp('Token verification failed immediately after creation:', error);
        }

        const tokenCookie = setCookie('token', token, {httpOnly: true, sameSite: 'strict'});

        logWithTimestamp('tokenCookie is:', tokenCookie)
        logWithTimestamp('env.JWT_SECRET is:', env.JWT_SECRET)

        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        return new Promise((resolve) => resolve(new Response(JSON.stringify({token, user: userInfo}), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': tokenCookie,
                ...corsHeaders,
            },
        })));
    } catch (error) {
        console.error('Login error:', error);
        return new Promise((resolve) => resolve(new Response('Error during login: ' + (error as Error).message, {
            status: 500,
            headers: corsHeaders,
        })));
    }
}