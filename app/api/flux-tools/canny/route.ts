import {NextRequest, NextResponse} from 'next/server';
import Replicate from 'replicate';
import {logWithTimestamp} from "@/utils/logUtils";
import {checkAndConsumePoints} from '@/utils/userUtils';
import {MODEL_CONFIG} from '@/public/constants/constants';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const prompt = formData.get('prompt') as string;
        const guidance = Number(formData.get('guidance'));
        const steps = Number(formData.get('steps'));
        const seed = Number(formData.get('seed'));
        const output_format = formData.get('output_format') as string;
        const safety_tolerance = Number(formData.get('safety_tolerance'));
        const prompt_upsampling = formData.get('prompt_upsampling') === 'true';

        if (!image) {
            return Response.json(
                {error: 'No image provided'},
                {status: 400}
            );
        }

        const pointsRequired = (MODEL_CONFIG as any)['canny'].points;
        const token = request.cookies.get('token')?.value || '';
        
        // 简化的点数检查 - 在实际应用中应该检查用户点数
        if (!token) {
            return Response.json(
                {error: 'Authentication required'}, 
                {status: 401}
            );
        }

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
            control_image: dataUrl,
            output_format,
            safety_tolerance,
            prompt_upsampling
        };

        const output = await replicate.run(
            "black-forest-labs/flux-canny-pro",
            {input}
        );

        logWithTimestamp('Canny output:', {
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
        console.error('Error in canny generation:', error);
        return Response.json(
            {error: 'Failed to generate image'},
            {status: 500}
        );
    }
}
