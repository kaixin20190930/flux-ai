import {NextRequest, NextResponse} from 'next/server';
import Replicate from "replicate";
import {getGenerationData} from '@/utils/cookieUtils';
import {logWithTimestamp} from '@/utils/logUtils';
import {updateUserPoints} from "@/utils/userUtils";
import {MODEL_CONFIG} from "@/public/constants/constants";
import {ModelType} from "@/public/types/type";


const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_DAILY_GENERATIONS = 3;
const COOKIE_NAME = 'fluxAIGenerations';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    let generationData = getGenerationData(req);
    const today = new Date().toDateString();
    logWithTimestamp('Generation request received', {generationData});

    if (generationData.date !== today) {
        generationData = {count: 0, date: today};
        logWithTimestamp('New day, reset generation count');
    }

    try {
        const {
            prompt, userPoints, userId, model,
            aspectRatio,
            format
        } = await req.json() as {
            prompt: string,
            userPoints?: number,
            userId?: string,
            model: ModelType,
            aspectRatio: string,
            format: string
        };

        const modelConfig = MODEL_CONFIG[model];
        if (!modelConfig) {
            return Response.json({error: 'Invalid model selected'}, {status: 400});
        }
        const isLoggedIn = userPoints !== undefined && userId !== undefined;
        const pointsRequired = modelConfig.points;
        const remainingFreePoints = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);

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
            if (model !== 'flux-schnell' && model !== 'flux-dev') {
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
            if (useUserPoints && isLoggedIn) {
                // 更新用户点数
                updatedUserPoints = userPoints - pointsToConsume;
                const updateSuccess = await updateUserPoints(req, updatedUserPoints);
                if (!updateSuccess) {
                    logWithTimestamp('Failed to update user points', {userId, newPoints: updatedUserPoints});
                    return Response.json({error: 'Failed to update user points'}, {status: 500});
                }
                logWithTimestamp('User points updated', {userId, newPoints: updatedUserPoints});
            } else {
                generationData.count += pointsToConsume;
            }

            const remainingFreeGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);

            logWithTimestamp('Image generated successfully', {remainingFreeGenerations, generationData});

            const response = NextResponse.json({
                image: imageUrl,
                remainingFreeGenerations,
                userPoints: isLoggedIn ? updatedUserPoints : null,
                pointsConsumed: pointsToConsume
            });

            // 设置 cookie
            const cookieValue = `${COOKIE_NAME}=${JSON.stringify(generationData)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
            response.headers.set('Set-Cookie', cookieValue);

            return response;
        } else {
            throw new Error('No image generated');
        }
    } catch
        (error) {
        logWithTimestamp('Error generating image', error);
        return Response.json({error: 'Failed to generate image'}, {status: 500});
    }
}