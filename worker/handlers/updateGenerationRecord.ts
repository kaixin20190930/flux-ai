import { Env } from '../types';

export async function handleUpdateGenerationRecord(request: Request, env: Env): Promise<Response> {
    const db = env.DB || env['DB-DEV'];
    if (!db) return new Response('No D1 database binding found!', { status: 500 });

    const body = await request.json() as { ipAddress: string; deviceFingerprint: string; date: string; count: number };
    const { ipAddress, deviceFingerprint, date, count } = body;
    await db.prepare(
        `INSERT INTO generation_records (ip_address, device_fingerprint, count, date)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(ip_address, device_fingerprint, date) 
         DO UPDATE SET count = count + ?, updated_at = CURRENT_TIMESTAMP`
    ).bind(ipAddress, deviceFingerprint, count, date, count).run();

    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
