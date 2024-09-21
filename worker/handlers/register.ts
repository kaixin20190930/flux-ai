import {Env} from '../types';
import {hashPassword} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleRegister(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],  // 根据请求设置允许的源
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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

        await env.DB.prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        )
            .bind(name, email, hashedPassword)
            .run();

        return new Promise((resolve) => resolve(new Response('User registered successfully', {
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
