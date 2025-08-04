import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";
import { getGenerationData } from '@/utils/cookieUtils';
import { logWithTimestamp } from '@/utils/logUtils';
import { updateUserPoints } from "@/utils/userUtils";
import { MODEL_CONFIG } from "@/public/constants/constants";
import { ModelType } from "@/public/types/type";
import { getGenerationRecord, updateGenerationRecord } from "@/utils/generationUtils";
import { checkRateLimit } from "@/utils/rateLimit";
import { Env } from '@/worker/types';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { ImageProcessingOptimizer } from '@/utils/performanceOptimizer';

interface GenerateRequest {
    prompt: string;
    userPoints?: number;
    userId?: string;
    model: ModelType;
    aspectRatio: string;
    format: string;
}

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_DAILY_GENERATIONS = 3;
const COOKIE_NAME = 'fluxAIGenerations';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    return PerformanceMonitor.measureAsync('api.generate', async () => {
        try {
            const env = process.env as unknown as Env;
            
            // 简化的速率限制检查 - 在实际应用中应该实现真正的速率限制
            // const isWithinRateLimit = await checkRateLimit(req, env);
            // if (!isWithinRateLimit) {
            //     PerformanceMonitor.recordCustomMetric('api.rate_limit_exceeded', 1);
            //     return Response.json({
            //         error: 'Too many requests. Please try again later.',
            //     }, { status: 429 });
            // }

        // 简化的生成记录检查 - 在实际应用中应该实现真正的生成记录
        // const generationRecord = await getGenerationRecord(req, env);
        const generationRecord = { count: 0 }; // 模拟数据

        // 验证生成次数
        if (generationRecord.count >= MAX_DAILY_GENERATIONS) {
            return Response.json({
                error: 'Daily generation limit reached',
            }, { status: 403 });
        }

        // 获取请求数据
        const requestData = await req.json() as GenerateRequest;
        const {
            prompt, userPoints, userId, model,
            aspectRatio, format
        } = requestData;

        const modelConfig = MODEL_CONFIG[model];
        if (!modelConfig) {
            return Response.json({ error: 'Invalid model selected' }, { status: 400 });
        }
        const isLoggedIn = userPoints !== undefined && userId !== undefined;
        const pointsRequired = modelConfig.points;
        const remainingFreePoints = Math.max(0, MAX_DAILY_GENERATIONS - generationRecord.count);

        if (!prompt) {
            logWithTimestamp('No prompt provided');
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        let useUserPoints = false;
        // 计算需要从用户账户扣除的点数
        let pointsToDeductFromUser = 0;
        let pointsToDeductFromFree = 0;

        if (!isLoggedIn) {
            // 检查是否是高级模型
            if (model !== 'flux-schnell' && model !== 'flux-dev' && model !== 'flux-1.1-pro-ultra') {
                return Response.json({
                    error: 'Premium model selected. Please login to continue.',
                }, { status: 403 });
            }

            // 检查免费额度是否足够
            if (remainingFreePoints < pointsRequired) {
                return Response.json({
                    error: 'Insufficient free generations. Please login to continue.',
                }, { status: 403 });
            }

            pointsToDeductFromFree = pointsRequired;
        } else {
            // 先使用免费点数
            pointsToDeductFromFree = Math.min(remainingFreePoints, pointsRequired);

            // 计算还需要从用户账户扣除的点数
            pointsToDeductFromUser = pointsRequired - pointsToDeductFromFree;

            // 检查用户点数是否足够支付剩余所需点数
            if (userPoints < pointsToDeductFromUser) {
                return Response.json({
                    error: `Insufficient points. You need ${pointsToDeductFromUser} more points.`,
                }, { status: 403 });
            }
        }

        logWithTimestamp('Generating image', { prompt, useUserPoints });
        const identifier: string = "black-forest-labs/" + model;
        
        // 使用性能监控包装图像生成
        const output = await PerformanceMonitor.measureAsync(
            'image.generation',
            async () => {
                return replicate.run(
                    identifier as any,
                    {
                        input: {
                            prompt: prompt,
                            image_dimensions: "1024*1024",
                            num_outputs: 1,
                            aspect_ratio: aspectRatio,
                            output_format: format,
                            num_inference_steps: 4,
                            guidance_scale: 7.5,
                            scheduler: "DPMSolverMultistep",
                        }
                    }
                );
            },
            { 
                model, 
                aspectRatio, 
                format,
                promptLength: prompt.length,
                userId: userId || 'anonymous'
            }
        );
        logWithTimestamp('Complete output:', {
            output,
            type: typeof output,
            isArray: Array.isArray(output)
        });
        let imageUrl = '';
        if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0];
        } else if (typeof output === 'string') {
            imageUrl = output;
        }

        if (imageUrl) {
            let updatedUserPoints = userPoints;

            if (pointsToDeductFromFree > 0) {
                generationRecord.count += pointsToDeductFromFree;
            }

            // 如果需要扣除用户点数
            if (pointsToDeductFromUser > 0 && isLoggedIn) {
                updatedUserPoints = userPoints - pointsToDeductFromUser;
                const updateSuccess = await updateUserPoints(parseInt(userId), updatedUserPoints);
                if (!updateSuccess) {
                    logWithTimestamp('Failed to update user points', { userId, newPoints: updatedUserPoints });
                    return Response.json({ error: 'Failed to update user points' }, { status: 500 });
                }
                logWithTimestamp('User points updated', {
                    userId,
                    newPoints: updatedUserPoints,
                    pointsDeducted: pointsToDeductFromUser
                });
            }

            const remainingFreeGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationRecord.count);

            logWithTimestamp('Image generated successfully', { remainingFreeGenerations, generationRecord });

            // 记录成功生成的指标
            PerformanceMonitor.recordCustomMetric('image.generation_success', 1, 'count', {
                model,
                userId: userId || 'anonymous',
                pointsUsed: pointsRequired
            });

            // 简化的生成记录更新 - 在实际应用中应该实现真正的生成记录更新
            // const updateGenerationSuccess = await updateGenerationRecord(req, env, pointsRequired);
            // if (!updateGenerationSuccess) {
            //     return Response.json({ error: 'Failed to update generation record' }, { status: 500 });
            // }

            const response = NextResponse.json({
                image: imageUrl,
                remainingFreeGenerations,
                userPoints: isLoggedIn ? updatedUserPoints : null,
                pointsConsumed: {
                    free: pointsToDeductFromFree,
                    paid: pointsToDeductFromUser,
                    total: pointsRequired
                }
            });

            // 设置 cookie
            const cookieValue = `${COOKIE_NAME}=${JSON.stringify(generationRecord)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
            response.headers.set('Set-Cookie', cookieValue);

            return response;
        } else {
            logWithTimestamp('No image generated');
            PerformanceMonitor.recordCustomMetric('image.generation_failed', 1, 'count', {
                model,
                reason: 'no_output'
            });
            return Response.json({ error: 'Failed to generate image' }, { status: 500 });
        }
        } catch (error) {
            logWithTimestamp('Error generating image:', error);
            PerformanceMonitor.recordCustomMetric('image.generation_error', 1, 'count', {
                model: 'unknown',
                error: error instanceof Error ? error.message : 'unknown_error'
            });
            return Response.json({ error: 'Failed to generate image' }, { status: 500 });
        }
    });
}