import {NextRequest, NextResponse} from 'next/server';
import Replicate from "replicate";
import {getGenerationData} from '../../../utils/cookieUtils';
import {logWithTimestamp} from '../../..//utils/logUtils';
import {updateUserPoints} from "@/utils/userUtils";


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
        const {prompt, userPoints, userId} = await req.json() as {
            prompt: string,
            userPoints?: number,
            userId?: string
        };
        const isLoggedIn = userPoints !== undefined && userId !== undefined;

        if (!prompt) {
            logWithTimestamp('No prompt provided');
            return Response.json({error: 'Prompt is required'}, {status: 400});
        }

        let useUserPoints = false;
        if (generationData.count >= MAX_DAILY_GENERATIONS) {
            if (!isLoggedIn || userPoints <= 0) {
                logWithTimestamp('Daily limit reached and no points available');
                return Response.json({error: 'Daily limit reached. Please login or purchase more points.'}, {status: 403});
            }
            useUserPoints = true;
        }

        logWithTimestamp('Generating image', {prompt, useUserPoints});

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    image_dimensions: "1024*1024",
                    num_outputs: 1,
                    num_inference_steps: 4,
                    guidance_scale: 7.5,
                    scheduler: "DPMSolverMultistep",
                }
            }
        );

        if (Array.isArray(output) && output.length > 0) {
            const imageUrl = output[0];
            let updatedUserPoints = userPoints;
            if (useUserPoints && isLoggedIn) {
                // 更新用户点数
                updatedUserPoints = userPoints - 1;
                const updateSuccess = await updateUserPoints(req, updatedUserPoints);
                if (!updateSuccess) {
                    logWithTimestamp('Failed to update user points', {userId, newPoints: updatedUserPoints});
                    return Response.json({error: 'Failed to update user points'}, {status: 500});
                }
                logWithTimestamp('User points updated', {userId, newPoints: updatedUserPoints});
            } else {
                generationData.count += 1;
            }

            const remainingFreeGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);

            logWithTimestamp('Image generated successfully', {remainingFreeGenerations, generationData});

            const response = NextResponse.json({
                image: imageUrl,
                remainingFreeGenerations,
                userPoints: isLoggedIn ? updatedUserPoints : null
            });

            // 设置 cookie
            const cookieValue = `${COOKIE_NAME}=${JSON.stringify(generationData)}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
            response.headers.set('Set-Cookie', cookieValue);

            return response;
        } else {
            throw new Error('No image generated');
        }
    } catch (error) {
        logWithTimestamp('Error generating image', error);
        return Response.json({error: 'Failed to generate image'}, {status: 500});
    }
}