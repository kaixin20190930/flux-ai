import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/utils/db';
import { Env } from '@/worker/types';

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: '用户ID是必需的' }, { status: 400 });
        }

        const db = new Database(process.env as unknown as Env);

        // 获取总生成次数
        const totalGenerations = await db.get(
            'SELECT COUNT(*) as count FROM generations WHERE user_id = ?',
            [userId]
        );

        // 获取总工具使用次数
        const totalTools = await db.get(
            'SELECT COUNT(*) as count FROM flux_tools_usage WHERE user_id = ?',
            [userId]
        );

        // 获取总消耗积分
        const totalPoints = await db.get(`
            SELECT SUM(points_consumed) as total FROM (
                SELECT points_consumed FROM generations WHERE user_id = ?
                UNION ALL
                SELECT points_consumed FROM flux_tools_usage WHERE user_id = ?
            )
        `, [userId, userId]);

        // 获取每日使用统计
        const dailyStats = await db.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(CASE WHEN type = 'generation' THEN 1 END) as generations,
                COUNT(CASE WHEN type = 'tool' THEN 1 END) as tools,
                SUM(points_consumed) as points
            FROM (
                SELECT 'generation' as type, created_at, points_consumed FROM generations WHERE user_id = ?
                UNION ALL
                SELECT 'tool' as type, created_at, points_consumed FROM flux_tools_usage WHERE user_id = ?
            )
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, [userId, userId]);

        // 获取模型使用分布
        const modelStats = await db.all(`
            SELECT 
                model_type as model,
                COUNT(*) as count
            FROM generations 
            WHERE user_id = ?
            GROUP BY model_type
            ORDER BY count DESC
        `, [userId]);

        // 获取工具使用分布
        const toolStats = await db.all(`
            SELECT 
                tool_type as tool,
                COUNT(*) as count
            FROM flux_tools_usage 
            WHERE user_id = ?
            GROUP BY tool_type
            ORDER BY count DESC
        `, [userId]);

        return NextResponse.json({
            totalGenerations: totalGenerations?.count || 0,
            totalTools: totalTools?.count || 0,
            totalPoints: totalPoints?.total || 0,
            dailyStats,
            modelStats,
            toolStats
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
    }
} 