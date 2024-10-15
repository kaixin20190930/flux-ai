import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {headers} from "next/headers";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleUpdateUserPoints(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        // 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
        return new Promise((resolve) => resolve(new Response('Unauthorized', {status: 401, headers: corsHeaders})));
    }

    try {
        const decoded = await verifyJWT(token, env.JWT_SECRET);
        const userId = decoded.userId;

        const {points} = await request.json();

        // 更新数据库中的用户点数
        const result = await env.DB.prepare('UPDATE users SET points = ? WHERE id = ?')
            .bind(points, userId)
            .run();

        if (result.success) {
            return new Promise((resolve) => resolve(new Response(JSON.stringify({success: true, points}), {
                status: 200,
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
            })));
        } else {
            throw new Error('Failed to update user points in database');
        }
    } catch (error) {
        console.error('Error updating user points:', error);
        return new Promise((resolve) => resolve(new Response('Error updating user points', {
            status: 500,
            headers: corsHeaders,
        })));
    }
}