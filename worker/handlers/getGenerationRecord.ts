import { Env } from '../types';

export async function handleGetGenerationRecord(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { ipAddress: string; deviceFingerprint: string; date: string };
    const { ipAddress, deviceFingerprint, date } = body;
    const record = await db.prepare(
        `SELECT * FROM generation_records WHERE ip_address = ? AND device_fingerprint = ? AND date = ?`
    ).bind(ipAddress, deviceFingerprint, date).first();

    return new Response(JSON.stringify(record || {}), {
        headers: { 'Content-Type': 'application/json' }
    });
}
