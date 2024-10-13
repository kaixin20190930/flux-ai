import {Env} from '../types';
import {createJWT, hashPassword} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

const allowedOrigins = [
    'http://45.129.228.105:*',          // 本地开发环境
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleRegister(request: Request, env: Env): Promise<Response> {
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
        const {name, email, password} = await request.json() as any;

        if (!name || !email || !password) {
            return new Promise((resolve) => resolve(new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            })));
        }

        const hashedPassword = await hashPassword(password);

        const result = await env.DB.prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        )
            .bind(name, email, hashedPassword)
            .run();

// 获取新插入的用户ID
        const userId = result.meta.last_row_id;

        // 创建JWT token
        const token = await createJWT({userId, username: name}, env.JWT_SECRET);

        const userInfo = {
            id: userId,
            name,
            email,
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
