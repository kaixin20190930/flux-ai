/**
 * 扣除用户积分处理器
 * Deduct User Points Handler
 */

import { Env } from '../types';
import { verifyJWT } from '../utils/auth';
import { logWithTimestamp } from '../utils/logUtils';

const allowedOrigins = [
    'http://localhost:3000',
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com',
    'https://2932-2409-8924-873-a935-8da0-94be-fcf3-d0c7.ngrok-free.app'
];

interface DeductPointsRequest {
    userId: number;
    points: number;
    reason?: string;
}

interface DeductPointsResponse {
    success: boolean;
    data?: {
        newBalance: number;
        pointsDeducted: number;
    };
    error?: {
        code: string;
        message: string;
    };
}

export async function handleDeductPoints(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    // 验证 JWT token
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
        logWithTimestamp('No token provided in deductPoints request');
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'No authentication token provided'
            }
        }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        // 验证 token
        const decoded = await verifyJWT(token, env.JWT_SECRET);
        const tokenUserId = decoded.userId;

        // 解析请求体
        const body = await request.json() as DeductPointsRequest;
        const { userId, points, reason = 'Points deduction' } = body;

        // 验证请求参数
        if (!userId || typeof points !== 'number' || points <= 0) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Invalid userId or points value'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 验证用户权限（只能扣除自己的积分）
        if (tokenUserId !== userId) {
            logWithTimestamp('User attempting to deduct points for another user:', {
                tokenUserId,
                requestedUserId: userId
            });
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cannot deduct points for another user'
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const db = env.DB || env['DB-DEV'];
        if (!db) {
            throw new Error('No D1 database binding found!');
        }

        // 获取当前积分
        const user = await db.prepare('SELECT points FROM users WHERE id = ?')
            .bind(userId)
            .first<{ points: number }>();

        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const currentPoints = user.points || 0;

        // 检查积分是否足够
        if (currentPoints < points) {
            logWithTimestamp('Insufficient points:', {
                userId,
                currentPoints,
                requiredPoints: points
            });
            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'INSUFFICIENT_POINTS',
                    message: `Insufficient points. Current: ${currentPoints}, Required: ${points}`
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 扣除积分
        const newBalance = currentPoints - points;
        const updateResult = await db.prepare('UPDATE users SET points = ? WHERE id = ?')
            .bind(newBalance, userId)
            .run();

        if (!updateResult.success) {
            throw new Error('Failed to update user points');
        }

        logWithTimestamp('Points deducted successfully:', {
            userId,
            pointsDeducted: points,
            oldBalance: currentPoints,
            newBalance,
            reason
        });

        const response: DeductPointsResponse = {
            success: true,
            data: {
                newBalance,
                pointsDeducted: points
            }
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        logWithTimestamp('Error deducting points:', error);
        return new Response(JSON.stringify({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
