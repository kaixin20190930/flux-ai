import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '../utils/auth';
import {logWithTimestamp} from "../utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com',// 生产环境
    'https://e83f-61-132-62-78.ngrok-free.app'
]

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
    // 添加其他可能的用户属性
}

export async function handleInsertTransaction(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        // 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    // const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    // if (!token) {
    //     return new Promise((resolve) => resolve(new Response('Unauthorized', {status: 401, headers: corsHeaders})));
    // }
    //
    try {
        //     const decoded = await verifyJWT(token, env.JWT_SECRET);
        //     const userId = decoded.userId;

        const transaction: Transaction = await request.json() as any;

        const db = env.DB || env['DB-DEV'];
        if (!db) {
            throw new Error('No D1 database binding found!');
        }


        // 更新数据库中的用户点数
        const insertTransactionResult = await db
            .prepare('INSERT INTO transactions (user_id, amount, points_added, stripe_session_id) VALUES (?, ?, ?, ?)')
            .bind(
                transaction.client_reference_id,
                transaction.amount_total,
                transaction.points_added,
                transaction.session_id
            )
            .run();

        if (insertTransactionResult.success) {
            return new Promise((resolve) => resolve(new Response(JSON.stringify({success: true, transaction}), {
                status: 200,
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
            })));
        } else {
            throw new Error('Failed to insert transaction in database');
        }
    } catch (error) {
        console.error('Error insert transaction:', error);
        return new Promise((resolve) => resolve(new Response('Error insert transaction', {
            status: 500,
            headers: corsHeaders,
        })));
    }
}
