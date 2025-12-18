import {NextRequest, NextResponse} from 'next/server';
import Replicate from "replicate";
import {getGenerationData} from '@/utils/cookieUtils';
import {logWithTimestamp} from '@/utils/logUtils';
import {updateUserPoints} from "@/utils/userUtils";
import {MODEL_CONFIG} from "@/public/constants/constants";
import {ModelType} from "@/public/types/type";
import {usageTrackingService} from '@/utils/usageTrackingService';
import {securePointsService} from '@/utils/securePointsService';
import {auth} from '@/lib/auth';


const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_DAILY_GENERATIONS = 3;
const COOKIE_NAME = 'fluxAIGenerations';


export const dynamic = 'force-dynamic'

// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime

export async function POST(req: NextRequest) {
    try {
        // Check authentication using NextAuth
        const session = await auth();
        
        // Get client information for tracking
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
        const fingerprintHash = req.headers.get('x-fingerprint-hash') || null;
        const userAgent = req.headers.get('user-agent') || undefined;

        const {
            prompt, model,
            aspectRatio,
            format
        } = await req.json() as {
            prompt: string,
            model: ModelType,
            aspectRatio: string,
            format: string
        };
        
        // Get user info from session if authenticated
        const userId = session?.user?.id;
        const userPoints = session?.user?.points;

        // Check if IP or fingerprint is blocked
        const [ipBlocked, fingerprintBlocked] = await Promise.all([
            usageTrackingService.isIPBlocked(ipAddress),
            fingerprintHash ? usageTrackingService.isFingerprintBlocked(fingerprintHash) : Promise.resolve(false)
        ]);

        if (ipBlocked || fingerprintBlocked) {
            logWithTimestamp('Access blocked:', { ipBlocked, fingerprintBlocked });
            return Response.json({
                error: 'Your access has been temporarily restricted due to suspicious activity.',
            }, { status: 403 });
        }

        // Check usage limits using multi-layer tracking
        const usageCheck = await usageTrackingService.checkUsageLimit(
            fingerprintHash,
            ipAddress,
            userId || null
        );

        if (!usageCheck.allowed) {
            logWithTimestamp('Usage limit exceeded:', usageCheck);
            return Response.json({
                error: usageCheck.reason || 'Daily generation limit reached',
            }, { status: 403 });
        }

        const modelConfig = MODEL_CONFIG[model];
        if (!modelConfig) {
            return Response.json({error: 'Invalid model selected'}, {status: 400});
        }
        const isLoggedIn = userPoints !== undefined && userId !== undefined;
        const pointsRequired = modelConfig.points;
        const remainingFreePoints = usageCheck.remaining;

        if (!prompt) {
            logWithTimestamp('No prompt provided');
            return Response.json({error: 'Prompt is required'}, {status: 400});
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
                }, {status: 403});
            }

            // 检查免费额度是否足够
            if (remainingFreePoints < pointsRequired) {
                return Response.json({
                    error: 'Insufficient free generations. Please login to continue.',
                }, {status: 403});
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
                }, {status: 403});
            }
        }

        // 新增：depth、fill、redux、canny 仅限登录用户
        const loginOnlyModels = ['depth', 'fill', 'redux', 'canny'];
        if (loginOnlyModels.includes(model) && !isLoggedIn) {
            return Response.json({
                error: '请登录后使用该功能',
            }, { status: 403 });
        }

        logWithTimestamp('Generating image', {prompt, useUserPoints});
        const identifier: string = "black-forest-labs/" + model;
        const output = await replicate.run(
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
        logWithTimestamp('Complete output:', {
            output,
            type: typeof output,
            isArray: Array.isArray(output)
        });
        let imageUrl = ''
        if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0];
        } else if (typeof output === 'string' && String(output).length > 0) {
            imageUrl = output as string;

        }
        if (imageUrl) {
            let updatedUserPoints = userPoints;
            const generationId = crypto.randomUUID();

            // Record usage in tracking system
            if (pointsToDeductFromFree > 0) {
                await usageTrackingService.recordGeneration(
                    fingerprintHash,
                    ipAddress,
                    userId || null,
                    userAgent
                );
            }

            // 如果需要扣除用户点数，使用安全的点数服务
            if (pointsToDeductFromUser > 0 && isLoggedIn) {
                const deductResult = await securePointsService.deductPoints(
                    userId,
                    pointsToDeductFromUser,
                    `Image generation - ${model}`,
                    generationId,
                    undefined,
                    { model, prompt: prompt.substring(0, 100) }
                );

                if (!deductResult.success) {
                    logWithTimestamp('Failed to deduct points:', deductResult.error);
                    return Response.json({ 
                        error: deductResult.error || 'Failed to deduct points' 
                    }, { status: 500 });
                }

                updatedUserPoints = deductResult.newBalance;
                logWithTimestamp('Points deducted successfully', {
                    userId,
                    newBalance: updatedUserPoints,
                    pointsDeducted: pointsToDeductFromUser,
                    transactionId: deductResult.transactionId
                });
            }

            // Get updated usage limits
            const updatedUsageCheck = await usageTrackingService.checkUsageLimit(
                fingerprintHash,
                ipAddress,
                userId || null
            );
            const remainingFreeGenerations = updatedUsageCheck.remaining;

            logWithTimestamp('Image generated successfully', { 
                remainingFreeGenerations, 
                trackingMethod: updatedUsageCheck.trackingMethod 
            });

            return NextResponse.json({
                image: imageUrl,
                remainingFreeGenerations,
                userPoints: isLoggedIn ? updatedUserPoints : null,
                pointsConsumed: {
                    free: pointsToDeductFromFree,
                    paid: pointsToDeductFromUser,
                    total: pointsRequired
                },
                trackingMethod: updatedUsageCheck.trackingMethod,
                generationId
            });
        } else {
            throw new Error('No image generated');
        }
    } catch
        (error) {
        logWithTimestamp('Error generating image', error);
        return Response.json({error: 'Failed to generate image'}, {status: 500});
    }
}