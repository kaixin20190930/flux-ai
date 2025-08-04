import {NextRequest} from 'next/server';
import {logWithTimestamp} from './logUtils';
import {Env} from '@/worker/types';

interface GenerationRecord {
    ipAddress: string;
    deviceFingerprint: string;
    userId?: string;
    count: number;
    date: string;
}

interface DBRecord {
    ip_address: string;
    device_fingerprint: string;
    user_id?: string;
    count: number;
    date: string;
}

export async function getGenerationRecord(ipAddress: string, deviceFingerprint: string, date: string) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/getGenerationRecord', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ipAddress, deviceFingerprint, date})
    });
    if (!response.ok) return null;
    return await response.json();
}

export async function updateGenerationRecord(ipAddress: string, deviceFingerprint: string, date: string, count: number) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/updateGenerationRecord', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ipAddress, deviceFingerprint, date, count})
    });
    if (!response.ok) return false;
    return (await response.json() as any).success;
}
