import {Env} from '../types';
import {verifyPassword, createJWT} from '@/utils/auth';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const {email, password} = await request.json() as any;

        if (!email || !password) {
            return new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            });
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first();

        if (!user || !(await verifyPassword(password, user.password as any))) {
            return new Response('Invalid credentials', {
                status: 401,
                headers: corsHeaders,
            });
        }

        const token = await createJWT({userId: user.id}, env.JWT_SECRET);

        return new Response(JSON.stringify({token}), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return new Response('Error during login', {
            status: 500,
            headers: corsHeaders,
        });
    }
}
