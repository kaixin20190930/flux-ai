import {NextRequest, NextResponse} from 'next/server';
import {recordToolUsage} from '@/utils/userUtils';
import * as workerJwt from '@tsndr/cloudflare-worker-jwt';

interface DepthRequest {
    image: string;
}

interface ReplicateResponse {
    output: string;
}

export const dynamic = 'force-dynamic'

// 强制使用 Edge Runtime (Cloudflare Pages 要求)
export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        console.log('收到depth请求');
        const {image} = await req.json() as DepthRequest;
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({error: '未登录'}, {status: 401});
        }

        console.log('token:', token);
        const decoded = workerJwt.decode(token);
        const payload = decoded.payload as { userId: number };
        const userId = payload.userId;
        if (!userId) {
            return NextResponse.json({error: '无效的用户ID'}, {status: 401});
        }

        console.log('userId:', userId);
        const pointsToDeduct = 1;
        console.info('开始检查用户是否有消费资格');
        console.log('调用checkAndConsumePoints参数:', pointsToDeduct, token);
        const consumeResponse = await fetch(`${req.nextUrl.origin}/api/points/consume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`
            },
            body: JSON.stringify({
                points: pointsToDeduct,
                type: 'depth'
            })
        });
        console.info('结束检查用户是否有消费资格');

        if (!consumeResponse.ok) {
            const error = await consumeResponse.json();
            return NextResponse.json(error, {status: consumeResponse.status});
        }

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
