import { Env } from '../types';

export async function handleCheckRateLimit(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { ipAddress: string; windowStart: number };
    const { ipAddress, windowStart } = body;
    const result = await db.prepare(
        `SELECT COUNT(*) as count FROM generation_records WHERE ip_address = ? AND created_at > datetime(?, 'unixepoch')`
    ).bind(ipAddress, windowStart).first<{ count: number }>();

    // 这里假设 MAX_REQUESTS_PER_WINDOW = 10
    const allowed = result && typeof result.count === 'number' ? result.count < 10 : true;
    return new Response(JSON.stringify({ allowed }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
