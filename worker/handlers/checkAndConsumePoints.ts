import { Env } from '../types';

export async function handleCheckAndConsumePoints(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { points: number, token: string };
    const { points, token } = body;
    // 这里假设你有 getUserIdFromToken 工具函数
    // 你需要根据你的实际实现来获取 userId
    // 这里只做伪代码示例：
    // const userId = await getUserIdFromToken(token, env);
    // 这里直接假设 token 就是 userId
    const userId = Number(token); // 实际项目请替换为真实的 token 解析
    if (!userId) {
        return new Response(JSON.stringify({ success: false, message: '用户未登录' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first<{ points: number }>();
    if (!user || typeof user.points !== 'number') {
        return new Response(JSON.stringify({ success: false, message: '用户不存在' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const currentPoints = user.points;
    if (currentPoints < points) {
        return new Response(JSON.stringify({ success: false, message: '积分不足' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const newPoints = currentPoints - points;
    await db.prepare('UPDATE users SET points = ? WHERE id = ?').bind(newPoints, userId).run();
    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
} 