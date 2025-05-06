import { NextRequest } from 'next/server';
import { logWithTimestamp } from './logUtils';
import { Env } from '@/worker/types';

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

export async function getGenerationRecord(req: NextRequest, env: Env): Promise<GenerationRecord> {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const deviceFingerprint = req.headers.get('user-agent') || 'unknown';
    const today = new Date().toDateString();

    try {
        // 从数据库获取记录
        const record = await env.DB.prepare(`
            SELECT * FROM generation_records 
            WHERE ip_address = ? AND device_fingerprint = ? AND date = ?
        `).bind(ipAddress, deviceFingerprint, today).first<DBRecord>();

        if (record) {
            return {
                ipAddress: record.ip_address,
                deviceFingerprint: record.device_fingerprint,
                userId: record.user_id,
                count: record.count,
                date: record.date
            };
        }

        // 如果没有记录，创建新记录
        return {
            ipAddress,
            deviceFingerprint,
            count: 0,
            date: today
        };
    } catch (error) {
        logWithTimestamp('Error getting generation record:', error);
        return {
            ipAddress,
            deviceFingerprint,
            count: 0,
            date: today
        };
    }
}

export async function updateGenerationRecord(
    req: NextRequest, 
    env: Env, 
    count: number
): Promise<boolean> {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const deviceFingerprint = req.headers.get('user-agent') || 'unknown';
    const today = new Date().toDateString();

    try {
        await env.DB.prepare(`
            INSERT INTO generation_records (ip_address, device_fingerprint, count, date)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(ip_address, device_fingerprint, date) 
            DO UPDATE SET count = count + ?, updated_at = CURRENT_TIMESTAMP
        `).bind(ipAddress, deviceFingerprint, count, today, count).run();

        return true;
    } catch (error) {
        logWithTimestamp('Error updating generation record:', error);
        return false;
    }
}
