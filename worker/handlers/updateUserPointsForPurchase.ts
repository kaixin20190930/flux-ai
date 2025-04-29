import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {headers} from "next/headers";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'  // 生产环境
]

export async function handleUpdateUserPointsForPurchase(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    // 验证请求来源
    if (!origin || !allowedOrigins.includes(origin)) {
        logWithTimestamp('Invalid origin:', origin);
        return new Promise((resolve) => resolve(new Response('Invalid origin', {
            status: 403,
            headers: corsHeaders
        })));
    }

    try {
        const {points, userId, purchaseId} = await request.json() as any;

        // 验证必要参数
        if (typeof points !== 'number' || !userId || !purchaseId) {
            logWithTimestamp('Invalid request parameters:', {points, userId, purchaseId});
            return new Promise((resolve) => resolve(new Response('Invalid request parameters', {
                status: 400,
                headers: corsHeaders
            })));
        }

        // 检查购买记录是否存在且未使用
        const purchaseRecord = await env.DB.prepare(
            'SELECT * FROM purchases WHERE id = ? AND user_id = ? AND status = ?'
        )
            .bind(purchaseId, userId, 'pending')
            .first();

        if (!purchaseRecord) {
            logWithTimestamp('Invalid or used purchase record:', purchaseId);
            return new Promise((resolve) => resolve(new Response('Invalid or used purchase record', {
                status: 400,
                headers: corsHeaders
            })));
        }

        // 使用事务来确保点数更新的原子性
        const result = await env.DB.prepare(`
            BEGIN TRANSACTION;
            UPDATE users SET points = points + ? WHERE id = ?;
            UPDATE purchases SET status = 'completed' WHERE id = ?;
            SELECT points FROM users WHERE id = ?;
            COMMIT;
        `)
            .bind(points, userId, purchaseId, userId)
            .run();

        if (result.success) {
            const updatedPoints = await env.DB.prepare('SELECT points FROM users WHERE id = ?')
                .bind(userId)
                .first();

            if (!updatedPoints) {
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