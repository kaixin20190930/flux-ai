import {NextRequest, NextResponse} from 'next/server';
import Replicate from "replicate";
import {getGenerationData} from '../../../utils/cookieUtils';
import {logWithTimestamp} from '../../..//utils/logUtils';


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

    // if (generationData.count >= MAX_DAILY_GENERATIONS) {
    //     logWithTimestamp('Daily limit reached');
    //     return Response.json({error: 'Daily limit reached. Please try again tomorrow.'}, {status: 403});
    // }

    try {
        const {prompt, userPoints} = await req.json() as { prompt: string, userPoints: number };

        if (generationData.count >= MAX_DAILY_GENERATIONS && userPoints <= 0) {
            logWithTimestamp('Daily limit reached');
            return Response.json({error: 'Daily limit reached. Please try again tomorrow.'}, {status: 403});
        }
        if (!prompt) {
            logWithTimestamp('No prompt provided');
            return Response.json({error: 'Prompt is required'}, {status: 400});
        }

        logWithTimestamp('Generating image', {prompt});

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

            generationData.count += 1;

            const remainingFreeGenerations = MAX_DAILY_GENERATIONS - generationData.count;

            logWithTimestamp('Image generated successfully', {remainingFreeGenerations, generationData});

            const response = NextResponse.json({
                image: imageUrl,
                remainingGenerations: remainingFreeGenerations
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