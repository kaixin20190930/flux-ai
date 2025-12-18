import {NextRequest, NextResponse} from 'next/server';
import {recordToolUsage} from '@/utils/userUtils';
import {auth} from '@/lib/auth';

interface DepthRequest {
    image: string;
}

interface ReplicateResponse {
    output: string;
}

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(req: NextRequest) {
    try {
        console.log('收到depth请求');
        
        // Check authentication using NextAuth
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({error: '未登录'}, {status: 401});
        }
        
        const userId = session.user.id;
        console.log('userId:', userId);
        
        const {image} = await req.json() as DepthRequest;
        const pointsToDeduct = 1;
        console.info('开始检查用户是否有消费资格');
        
        // Check if user has enough points
        if (session.user.points < pointsToDeduct) {
            return NextResponse.json(
                {error: 'Insufficient points'}, 
                {status: 403}
            );
        }
        
        console.info('结束检查用户是否有消费资格');

        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "c11bac5826c4f8d1b1a0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0",
                input: {
                    image: image
                }
            })
        });

        if (!response.ok) {
            throw new Error('深度估计API调用失败');
        }

        const prediction = await response.json() as ReplicateResponse;
        const outputUrl = prediction.output;

        console.log('调用recordToolUsage参数:', userId, 'depth', image, outputUrl, pointsToDeduct);
        const recordResult = await recordToolUsage(
            userId,
            'depth',
            image,
            outputUrl,
            pointsToDeduct
        );
        console.log('recordToolUsage结果:', recordResult);

        return NextResponse.json({
            success: true,
            outputUrl
        });
    } catch (error) {
        console.error('深度估计失败:', error);
        return NextResponse.json({error: '深度估计失败'}, {status: 500});
    }
}
