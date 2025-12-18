import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '../utils/auth';
import {logWithTimestamp} from "../utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com',  // 生产环境
    'https://2932-2409-8924-873-a935-8da0-94be-fcf3-d0c7.ngrok-free.app'

]

interface UserPoints {
    points: number;
}

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
        logWithTimestamp('No token provided in updateUserPoints request');
        return new Promise((resolve) => resolve(new Response('Unauthorized', {status: 401, headers: corsHeaders})));
    }

    try {
        const decoded = await verifyJWT(token, env.JWT_SECRET);
        const userId = decoded.userId;

        const {points} = await request.json() as any;
        if (typeof points !== 'number') {
            logWithTimestamp('Invalid points value:', points);
            return new Promise((resolve) => resolve(new Response('Invalid points value', {status: 400, headers: corsHeaders})));
        }

        const db = env.DB || env['DB-DEV'];
        if (!db) {
            throw new Error('No D1 database binding found!');
        }

        const result = await db.prepare('UPDATE users SET points = points + ? WHERE id = ?').bind(points, userId).run();
        return new Response(JSON.stringify({ success: result.success === true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        logWithTimestamp('Error updating user points:', error);
        return new Promise((resolve) => resolve(new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
        }), {
            status: 500,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
        })));
    }
}
