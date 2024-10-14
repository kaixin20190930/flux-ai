import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {headers} from "next/headers";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleGetUserPoints(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
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

        logWithTimestamp('get user id is', userId)

        const points = await getUserPoints(env, userId);

        logWithTimestamp('get user points is', points)

        return new Promise((resolve) => resolve(new Response(JSON.stringify({points}), {
            headers: corsHeaders,
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
        const result = await env.DB.prepare('SELECT points FROM users WHERE id = ?')
            .bind(userId)
            .first();
        logWithTimestamp('get user result is', result?.toString())

        const points = (result?.points as number | undefined) ?? null;
        return points;
    } catch (error) {
        console.error('Error fetching user points:', error);
        return null;
    }
}