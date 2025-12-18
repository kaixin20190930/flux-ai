import {NextRequest, NextResponse} from 'next/server';
import {getUserPoints, updateUserPoints} from '@/utils/userUtils';
import {auth} from '@/lib/auth';

interface ConsumePointsRequest {
    points: number;
    type: string;
}

// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
    try {
        console.log('收到consume points请求');
        const {points, type} = await req.json() as ConsumePointsRequest;
        
        // Check authentication using NextAuth
        const session = await auth();
        
        if (!session?.user) {
            return Response.json({error: '未登录'}, {status: 401});
        }

        const userId = session.user.id;
        console.log('userId:', userId);

        console.log('userId:', userId);
        const userPoints = await getUserPoints(userId);
        if (!userPoints || userPoints < points) {
            return Response.json({error: '点数不足'}, {status: 400});
        }

        console.log('调用getUserPoints参数:', userId);
        const pointsToDeduct = -points;
        const updateResult = await updateUserPoints(userId, pointsToDeduct);
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
