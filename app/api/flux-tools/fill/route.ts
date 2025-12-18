import {NextRequest, NextResponse} from 'next/server';
import Replicate from 'replicate';
import {logWithTimestamp} from "@/utils/logUtils";
import {checkAndConsumePoints} from '@/utils/userUtils';
import {MODEL_CONFIG} from '@/public/constants/constants';
import {auth} from '@/lib/auth';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(request: NextRequest) {
    try {
        // Check authentication using NextAuth
        const session = await auth();
        
        if (!session?.user) {
            return Response.json(
                {error: 'Authentication required'}, 
                {status: 401}
            );
        }
        
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const mask = formData.get('mask') as string;
        const prompt = formData.get('prompt') as string;
        const guidance = Number(formData.get('guidance'));
        const steps = Number(formData.get('steps'));
        const seed = Number(formData.get('seed'));
        const output_format = formData.get('output_format') as string;
        const safety_tolerance = Number(formData.get('safety_tolerance'));
        const prompt_upsampling = formData.get('prompt_upsampling') === 'true';

        if (!image || !mask) {
            return Response.json(
                {error: 'No image or mask provided'},
                {status: 400}
            );
        }

        const pointsRequired = (MODEL_CONFIG as any)['fill'].points;

        // 将图片转换为 base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${image.type};base64,${base64Image}`;

        const input = {
            seed,
            steps,
            prompt,
            guidance,
            image: dataUrl,
            mask,
            output_format,
            safety_tolerance,
            prompt_upsampling
        };

        const output = await replicate.run(
            "black-forest-labs/flux-fill-pro",
            {input}
        );

        logWithTimestamp('Fill output:', {
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
        console.error('Error in fill generation:', error);
        return Response.json(
            {error: 'Failed to generate image'},
            {status: 500}
        );
    }
}
