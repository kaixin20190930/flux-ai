import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {headers} from "next/headers";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'  // 生产环境
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

        // 使用事务来确保点数更新的原子性
        const result = await env.DB.prepare(`
            BEGIN TRANSACTION;
            UPDATE users SET points = ? WHERE id = ?;
            SELECT points FROM users WHERE id = ?;
            COMMIT;
        `)
            .bind(points, userId, userId)
            .run();

        if (result.success) {
            const updatedPoints = await env.DB.prepare('SELECT points FROM users WHERE id = ?')
                .bind(userId)
                .first<UserPoints>();
            
            if (!updatedPoints) {
                logWithTimestamp('Failed to retrieve updated points for user:', userId);
                throw new Error('Failed to retrieve updated points');
            }

            logWithTimestamp(`Successfully updated points for user ${userId} to ${updatedPoints.points}`);
            
            return new Promise((resolve) => resolve(new Response(JSON.stringify({
                success: true, 
                points: updatedPoints.points
            }), {
                status: 200,
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
            })));
        } else {
            logWithTimestamp('Failed to update user points in database');
            throw new Error('Failed to update user points in database');
        }
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