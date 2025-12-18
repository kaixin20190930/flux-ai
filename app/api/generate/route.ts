/**
 * 图片生成 API V2 - 新积分系统
 * 简化版本，所有积分逻辑在 Worker 中处理
 */

import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";
import { logWithTimestamp } from '@/utils/logUtils';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export const dynamic = 'force-dynamic';

// Worker URL - 注意：Wrangler 可能使用随机端口
const WORKER_URL = process.env.NODE_ENV === 'production'
    ? 'https://flux-ai-worker.liukai19911010.workers.dev'
    : process.env.WORKER_URL_DEV || 'http://localhost:8787';

export async function POST(req: NextRequest) {
    try {
        // 1. 获取请求参数
        const body = await req.json() as { prompt: string; model: string; aspectRatio?: string; format?: string };
        const { prompt, model, aspectRatio, format } = body;
        
        if (!prompt || !model) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 2. 获取用户信息
        const token = req.headers.get('authorization')?.replace('Bearer ', '') || null;
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         req.ip ||
                         '127.0.0.1'; // 本地开发默认值
        const fingerprintHash = req.headers.get('x-fingerprint-hash') || null;
        
        logWithTimestamp('Request headers:', {
            hasToken: !!token,
            ipAddress,
            hasFingerprintHash: !!fingerprintHash,
            allHeaders: Object.fromEntries(req.headers.entries())
        });

        // 3. 如果有 token，验证并获取 userId
        let userId: number | undefined = undefined;
        if (token) {
            try {
                const verifyResponse = await fetch(`${WORKER_URL}/auth/verify-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                
                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json() as { success: boolean; user?: { id: number } };
                    if (verifyData.success && verifyData.user) {
                        userId = verifyData.user.id;
                    }
                }
            } catch (error) {
                logWithTimestamp('Token verification failed:', error);
            }
        }

        logWithTimestamp('Generate request:', { 
            model, 
            hasToken: !!token,
            userId,
            ipAddress: ipAddress.substring(0, 10) + '...'
        });

        // 4. 调用 Worker 创建生成任务（检查积分并扣除）
        const generationResponse = await fetch(`${WORKER_URL}/generation/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'x-fingerprint-hash': fingerprintHash || '',
            },
            body: JSON.stringify({
                model,
                prompt,
                userId,
                ipAddress,
                fingerprintHash,
            }),
        });

        if (!generationResponse.ok) {
            const error = await generationResponse.json() as { error?: string };
            logWithTimestamp('Worker rejected generation:', error);
            return Response.json({ 
                error: error.error || 'Failed to create generation' 
            }, { status: generationResponse.status });
        }

        const generationData = await generationResponse.json() as {
            success: boolean;
            data: {
                generationId: string;
                pointsDeducted: number;
                usedFreeTier: boolean;
                newBalance: number;
                freeGenerationsRemaining: number;
            };
        };
        const { generationId, pointsDeducted, usedFreeTier, newBalance, freeGenerationsRemaining } = generationData.data;

        logWithTimestamp('Generation approved:', { 
            generationId, 
            pointsDeducted, 
            usedFreeTier,
            newBalance
        });

        // 5. 调用 Replicate API 生成图片
        const identifier = `black-forest-labs/${model}`;
        const output = await replicate.run(identifier as any, {
            input: {
                prompt,
                aspect_ratio: aspectRatio || '1:1',
                output_format: format || 'jpg',
                num_inference_steps: 4,
            }
        });

        // 6. 获取图片 URL
        let imageUrl = '';
        if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0];
        } else if (typeof output === 'string') {
            imageUrl = output;
        }

        if (!imageUrl) {
            logWithTimestamp('No image generated');
            return Response.json({ error: 'Failed to generate image' }, { status: 500 });
        }

        logWithTimestamp('Image generated successfully:', { 
            generationId,
            imageUrl: imageUrl.substring(0, 50) + '...'
        });

        // 7. 返回结果
        return NextResponse.json({
            image: imageUrl,
            userPoints: usedFreeTier ? null : newBalance,
            freeGenerationsRemaining: usedFreeTier ? freeGenerationsRemaining : 0,
            pointsConsumed: pointsDeducted,
            usedFreeTier,
            generationId
        });

    } catch (error) {
        logWithTimestamp('Error generating image:', error);
        return Response.json({ 
            error: error instanceof Error ? error.message : 'Failed to generate image' 
        }, { status: 500 });
    }
}
