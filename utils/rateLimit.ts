import { NextRequest } from 'next/server';
import { logWithTimestamp } from './logUtils';
import { Env } from '@/worker/types';

const RATE_LIMIT_WINDOW = 60 * 60; // 1小时
const MAX_REQUESTS_PER_WINDOW = 10;

interface RateLimitResult {
    count: number;
}

export async function checkRateLimit(req: NextRequest, env: Env): Promise<boolean> {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - RATE_LIMIT_WINDOW;

    try {
        const result = await env.DB.prepare(`
            SELECT COUNT(*) as count 
            FROM generation_records 
            WHERE ip_address = ? 
            AND created_at > datetime(?, 'unixepoch')
        `).bind(ipAddress, windowStart).first<RateLimitResult>();

        return result?.count ? result.count < MAX_REQUESTS_PER_WINDOW : true;
    } catch (error) {
        logWithTimestamp('Error checking rate limit:', error);
        // 如果发生错误，默认允许请求通过
        return true;
    }
}
