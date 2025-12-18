import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ❌ 移除 Edge Runtime（因为现在使用 Prisma）
// export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 });
        }

        // 获取总生成次数
        const totalGenerations = await prisma.generation.count({
            where: { userId }
        });

        // 获取总工具使用次数
        const totalTools = await prisma.fluxToolUsage.count({
            where: { userId }
        });

        // 获取总消耗积分
        const generationsPoints = await prisma.generation.aggregate({
            where: { userId },
            _sum: { pointsConsumed: true }
        });

        const toolsPoints = await prisma.fluxToolUsage.aggregate({
            where: { userId },
            _sum: { pointsConsumed: true }
        });

        const totalPoints = (generationsPoints._sum.pointsConsumed || 0) + 
                           (toolsPoints._sum.pointsConsumed || 0);

        // 获取每日使用统计（最近30天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 获取每日生成统计
        const dailyGenerations = await prisma.$queryRaw<Array<{
            date: Date;
            count: bigint;
            points: bigint;
        }>>`
            SELECT 
                DATE("createdAt") as date,
                COUNT(*)::bigint as count,
                SUM("pointsConsumed")::bigint as points
            FROM "generations"
            WHERE "userId" = ${userId}
                AND "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date DESC
        `;

        // 获取每日工具使用统计
        const dailyTools = await prisma.$queryRaw<Array<{
            date: Date;
            count: bigint;
            points: bigint;
        }>>`
            SELECT 
                DATE("createdAt") as date,
                COUNT(*)::bigint as count,
                SUM("pointsConsumed")::bigint as points
            FROM "flux_tool_usages"
            WHERE "userId" = ${userId}
                AND "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date DESC
        `;

        // 获取模型使用分布
        const modelStats = await prisma.generation.groupBy({
            by: ['modelType'],
            where: { userId },
            _count: { modelType: true },
            orderBy: { _count: { modelType: 'desc' } }
        });

        // 获取工具使用分布
        const toolStats = await prisma.fluxToolUsage.groupBy({
            by: ['toolType'],
            where: { userId },
            _count: { toolType: true },
            orderBy: { _count: { toolType: 'desc' } }
        });

        return NextResponse.json({
            totalGenerations,
            totalTools,
            totalPoints,
            dailyStats: {
                generations: dailyGenerations.map(stat => ({
                    date: stat.date,
                    count: Number(stat.count),
                    points: Number(stat.points)
                })),
                tools: dailyTools.map(stat => ({
                    date: stat.date,
                    count: Number(stat.count),
                    points: Number(stat.points)
                }))
            },
            modelStats: modelStats.map(stat => ({
                model: stat.modelType,
                count: stat._count.modelType
            })),
            toolStats: toolStats.map(stat => ({
                tool: stat.toolType,
                count: stat._count.toolType
            }))
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
    }
} 