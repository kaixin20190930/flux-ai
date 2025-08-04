import { Env } from '../types';

export async function handleRecordToolUsage(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { userId: number, toolType: string, inputImageUrl: string, outputImageUrl: string, pointsConsumed: number };
    const { userId, toolType, inputImageUrl, outputImageUrl, pointsConsumed } = body;
    const result = await db.prepare('INSERT INTO flux_tools_usage (user_id, tool_type, input_image_url, output_image_url, points_consumed) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, toolType, inputImageUrl, outputImageUrl, pointsConsumed).run();
    return new Response(JSON.stringify({ success: result.success === true }), {
        headers: { 'Content-Type': 'application/json' }
    });
} 