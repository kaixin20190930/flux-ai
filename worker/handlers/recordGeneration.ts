import { Env } from '../types';

export async function handleRecordGeneration(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { userId: number, modelType: string, prompt: string, imageUrl: string, pointsConsumed: number };
    const { userId, modelType, prompt, imageUrl, pointsConsumed } = body;
    const result = await db.prepare('INSERT INTO generations (user_id, model_type, prompt, image_url, points_consumed) VALUES (?, ?, ?, ?, ?)')
        .bind(userId, modelType, prompt, imageUrl, pointsConsumed).run();
    return new Response(JSON.stringify({ success: result.success === true }), {
        headers: { 'Content-Type': 'application/json' }
    });
} 