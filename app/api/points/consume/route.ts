import {NextRequest, NextResponse} from 'next/server';
import {getUserPoints, updateUserPoints} from '@/utils/userUtils';
import {getUserIdFromToken} from '@/utils/auth';

interface ConsumePointsRequest {
    points: number;
    type: string;
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
    try {
        console.log('收到consume points请求');
        const {points, type} = await req.json() as ConsumePointsRequest;
        const token = req.cookies.get('token' as any)?.value;

        if (!token) {
            return Response.json({error: '未登录'}, {status: 401});
        }

        console.log('token:', token);
        const userId = await getUserIdFromToken(token);
        if (!userId) {
            return Response.json({error: '无效的用户ID'}, {status: 401});
        }

        console.log('userId:', userId);
        const userPoints = await getUserPoints(userId);
        if (!userPoints || userPoints < points) {
            return Response.json({error: '点数不足'}, {status: 400});
        }

        console.log('调用getUserPoints参数:', userId);
        const pointsToDeduct = -points;
        const updateResult = await updateUserPoints(Number(userId), pointsToDeduct);
        console.log('updateUserPoints结果:', updateResult);
        const remainingPoints = await getUserPoints(userId);
        console.log('再次getUserPoints结果:', remainingPoints);

        return NextResponse.json({
            success: true,
            remainingPoints,
            consumedPoints: points,
            type
        });
    } catch (error) {
        console.error('点数消耗失败:', error);
        return Response.json({error: '点数消耗失败'}, {status: 500});
    }
}
