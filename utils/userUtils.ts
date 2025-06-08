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

export async function getUserPoints(env: Env, userId: number): Promise<number | null> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const result = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first();
        return (result && typeof result.points === 'number') ? result.points : null;
    } catch (error) {
        console.error('获取用户点数失败:', error);
        return null;
    }
}

export async function updateUserPoints(env: Env, userId: number, points: number): Promise<boolean> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const result = await db.prepare('UPDATE users SET points = points + ? WHERE id = ?').bind(points, userId).run();
        // D1Result 没有 changes 属性，判断 success
        return result.success === true;
    } catch (error) {
        console.error('更新用户点数失败:', error);
        return false;
    }
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
export async function checkAndConsumePoints(env: Env, points: number, token: string): Promise<boolean> {
    try {
        const userId = await getUserIdFromToken(token, env);
        if (!userId) {
            logWithTimestamp('用户未登录');
            return false;
        }

        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first();
        
        if (!user || typeof user.points !== 'number') {
            logWithTimestamp('用户不存在');
            return false;
        }

        const currentPoints = user.points;
        if (currentPoints < points) {
            logWithTimestamp('积分不足');
            return false;
        }

        const newPoints = currentPoints - points;
        await db.prepare('UPDATE users SET points = ? WHERE id = ?').bind(newPoints, userId).run();
        logWithTimestamp(`用户 ${userId} 消费 ${points} 积分，剩余 ${newPoints} 积分`);
        
        return true;
    } catch (error) {
        logWithTimestamp('消费积分失败:', error);
        return false;
    }
}

export async function recordGeneration(env: Env, userId: number, modelType: string, prompt: string, imageUrl: string, pointsConsumed: number): Promise<boolean> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const result = await db.prepare('INSERT INTO generations (user_id, model_type, prompt, image_url, points_consumed) VALUES (?, ?, ?, ?, ?)').bind(userId, modelType, prompt, imageUrl, pointsConsumed).run();
        return result.success === true;
    } catch (error) {
        console.error('记录生成历史失败:', error);
        return false;
    }
}

export async function recordToolUsage(env: Env, userId: number, toolType: string, inputImageUrl: string, outputImageUrl: string, pointsConsumed: number): Promise<boolean> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const result = await db.prepare('INSERT INTO flux_tools_usage (user_id, tool_type, input_image_url, output_image_url, points_consumed) VALUES (?, ?, ?, ?, ?)').bind(userId, toolType, inputImageUrl, outputImageUrl, pointsConsumed).run();
        return result.success === true;
    } catch (error) {
        console.error('记录工具使用历史失败:', error);
        return false;
    }
}
