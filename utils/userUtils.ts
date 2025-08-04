import {getUserFromCookie, getUserFromLocalStorage} from './authUtils';
import {NextRequest} from 'next/server';
import {Env} from '@/worker/types';
import {logWithTimestamp} from "@/utils/logUtils";
import {verifyJWT, getUserIdFromToken} from "@/utils/auth";

// import os from 'os';


export interface User {
    userId: string;
    name: string;
    email: string;
    points: number;
    subscription_type: string | null;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    // 添加其他可能的用户属性
}

export interface Data2 {
    points: number;
}

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
    // 添加其他可能的用户属性
}

export async function getUserPoints(userId: number): Promise<number | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('https://flux-ai.liukai19911010.workers.dev/getuserpoints', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userId}),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error('getUserPoints failed:', response.status, response.statusText);
            return null;
        }
        
        const data = await response.json() as { points?: number };
        return typeof data.points === 'number' ? data.points : null;
    } catch (error) {
        console.error('getUserPoints error:', error);
        return null;
    }
}

export async function updateUserPoints(userId: number, points: number): Promise<boolean> {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/updateuserpoints', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, points})
    });
    if (!response.ok) return false;
    const data = await response.json() as { success?: boolean };
    return data.success === true;
}

export async function updateUserPurchase(points: number, userId: string) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/updateuserpurchase', {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({points, userId})
    });
    if (response.ok) {
        const data: { success: boolean, points: number } = await response.json();
        logWithTimestamp('Update result:', data);
        return 'success';
    } else {
        console.error('Error updating user points');
        return 'failed';
    }
}

export async function insertTransaction(transaction: Transaction) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/inserttransaction', {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
    });
    if (response.ok) {
        return 'success';
    } else {
        console.error('Error insert transaction');
        return 'failed';
    }
}

export async function getTransaction(sessionId: string) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/gettransaction', {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionId)
    });
    if (response.ok) {
        return response;
    } else {
        console.error('Error insert transaction');
        throw new Error('No transaction get');
    }
}

// 检查是否登录并消耗点数
export async function checkAndConsumePoints(points: number, token: string): Promise<boolean> {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/checkAndConsumePoints', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({points, token})
    });
    if (!response.ok) return false;
    const data = await response.json() as { success?: boolean };
    return data.success === true;
}

export async function recordGeneration(userId: number, modelType: string, prompt: string, imageUrl: string, pointsConsumed: number): Promise<boolean> {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/recordGeneration', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, modelType, prompt, imageUrl, pointsConsumed})
    });
    if (!response.ok) return false;
    const data = await response.json() as { success?: boolean };
    return data.success === true;
}

export async function recordToolUsage(userId: number, toolType: string, inputImageUrl: string, outputImageUrl: string, pointsConsumed: number): Promise<boolean> {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/recordToolUsage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, toolType, inputImageUrl, outputImageUrl, pointsConsumed})
    });
    if (!response.ok) return false;
    const data = await response.json() as { success?: boolean };
    return data.success === true;
}

export async function getGenerationRecord(userId: number) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/getGenerationRecord', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId})
    });
    if (!response.ok) return null;
    return await response.json();
}

export async function updateGenerationRecord(userId: number, data: any) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/updateGenerationRecord', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, data})
    });
    if (!response.ok) return null;
    return await response.json();
}

export async function checkRateLimit(userId: number) {
    const response = await fetch('https://flux-ai.liukai19911010.workers.dev/checkRateLimit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId})
    });
    if (!response.ok) return true;
    return (await response.json() as any).allowed;
}
