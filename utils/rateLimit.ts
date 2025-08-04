import {NextRequest} from 'next/server';
import {logWithTimestamp} from './logUtils';
import {Env} from '@/worker/types';

const RATE_LIMIT_WINDOW = 60 * 60; // 1小时
const MAX_REQUESTS_PER_WINDOW = 10;

interface RateLimitResult {
    count: number;
}

export async function checkRateLimit(ipAddress: string, windowStart: number) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/checkRateLimit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ipAddress, windowStart})
    });
    if (!response.ok) return true;
    return (await response.json() as any).allowed;
}
