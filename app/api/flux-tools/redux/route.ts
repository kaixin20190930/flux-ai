import {NextRequest, NextResponse} from 'next/server';
import Replicate from "replicate";
import {logWithTimestamp} from '@/utils/logUtils';
import { checkAndConsumePoints } from '@/utils/userUtils';
import { MODEL_CONFIG } from '@/public/constants/constants';
import {auth} from '@/lib/auth';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export const dynamic = 'force-dynamic';


// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(req: NextRequest) {
    try {
        // Check authentication using NextAuth
        const session = await auth();
        
        if (!session?.user) {
            return Response.json(
                {error: 'Authentication required'}, 
                {status: 401}
            );
        }
        
        const formData = await req.formData();
        const image = formData.get('image') as File;
        const guidance = Number(formData.get('guidance'));
        const megapixels = formData.get('megapixels') as string;
        const num_outputs = Number(formData.get('num_outputs'));
        const aspect_ratio = formData.get('aspect_ratio') as string;
        const output_format = formData.get('output_format') as string;
        const output_quality = Number(formData.get('output_quality'));
        const num_inference_steps = Number(formData.get('num_inference_steps'));

        if (!image) {
            return Response.json({error: 'No image provided'}, {status: 400});
        }

        const pointsRequired = (MODEL_CONFIG as any)['redux'].points;

        // 将图片转换为 base64
        const imageBuffer = await image.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const imageDataUrl = `data:${image.type};base64,${base64Image}`;

        logWithTimestamp('Generating image with Redux', {
            guidance,
            megapixels,
            num_outputs,
            aspect_ratio,
            output_format,
            output_quality,
            num_inference_steps
        });

        const output = await replicate.run(
            "black-forest-labs/flux-redux-dev",
            {
                input: {
                    guidance,
                    megapixels,
                    num_outputs,
                    redux_image: imageDataUrl,
                    aspect_ratio,
                    output_format,
                    output_quality,
                    num_inference_steps
                }
            }
        );

        logWithTimestamp('Redux output:', {
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
            return Response.json({image: imageUrl});
        } else {
            throw new Error('No image generated');
        }
    } catch (error) {
        logWithTimestamp('Error generating image with Redux:', error);
        return Response.json({error: 'Failed to generate image'}, {status: 500});
    }
}
