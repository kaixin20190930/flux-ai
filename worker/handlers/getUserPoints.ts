import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '../utils/auth';
import {logWithTimestamp} from "../utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com',  // 生产环境
    'https://e83f-61-132-62-78.ngrok-free.app'

]

export async function handleGetUserPoints(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    //
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        // 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
        return new Promise((resolve) => resolve(new Response('Unauthorized', {
            status: 401,
            headers: corsHeaders
        })));
    }

    try {
        const decoded = await verifyJWT(token, env.JWT_SECRET);
        const userId = decoded.userId;
        logWithTimestamp('env.JWT_SECRET is', env.JWT_SECRET)
        logWithTimestamp('env.ENVIRONMENT is', env.ENVIRONMENT)

        logWithTimestamp('get user id is', userId)

        const points = await getUserPoints(env, userId);

        logWithTimestamp('get user points is', points)

        return new Promise((resolve) => resolve(new Response(JSON.stringify({points}), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        })));

    } catch (error) {
        return new Promise((resolve) => resolve(new Response('Error fetching user points', {
            status: 500,
            headers: corsHeaders
        })));
    }
}

async function getUserPoints(env: Env, userId: string): Promise<number | null> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) {
            throw new Error('No D1 database binding found!');
        }

        logWithTimestamp('start get userPoints from DB')
        const result = await db.prepare('SELECT points FROM users WHERE id = ?')
            .bind(userId)
            .first();
        // logWithTimestamp('get user result is', result?.toString())
        logWithTimestamp('end get userPoints from DB')

        return (result?.points as number | undefined) ?? null;
    } catch (error) {
        console.error('Error fetching user points:', error);
        return null;
    }
}
