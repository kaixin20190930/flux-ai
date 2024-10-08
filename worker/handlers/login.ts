import {Env} from '../types';
import {verifyPassword, createJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleLogin(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
    };
    try {
        const {email, password} = await request.json() as any;

        if (!email || !password) {
            return new Promise((resolve) => resolve(new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            })));
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first();

        if (!user || !(await verifyPassword(password, user.password as string))) {
            return new Promise((resolve) => resolve(new Response('Invalid credentials', {
                status: 401,
                headers: corsHeaders,
            })));
        }

        const token = await createJWT({userId: user.id}, env.JWT_SECRET);

        return new Promise((resolve) => resolve(new Response(JSON.stringify({token}), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
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
