import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {setCookie} from "@/utils/cookieUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleLogin(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        // 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
            // Add any other user information you want to send to the client
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
