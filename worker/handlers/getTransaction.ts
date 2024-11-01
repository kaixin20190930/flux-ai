import {Env} from '../types';
import {verifyPassword, createJWT, verifyJWT} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";
import {headers} from "next/headers";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'http://10.124.124.163:3000',
    'https://flux-ai-img.com'  // 生产环境
]

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
    // 添加其他可能的用户属性
}

export async function handleGetTransaction(request: Request, env: Env): Promise<Response> {
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

        const sessionId: string = await request.json() as any;

        // 更新数据库中的用户点数
        const {results} = await env.DB
            .prepare('SELECT points_added FROM transactions WHERE stripe_session_id = ?')
            .bind(sessionId)
            .all();

        if (!results || results.length === 0) {
            return Response.json({error: 'Transaction not found'}, {status: 404} as any);
        }

        const transaction = results[0];
        return Response.json({pointsAdded: transaction.points_added});
    } catch (error) {
        console.error('Error insert transaction:', error);
        return new Promise((resolve) => resolve(new Response('Error insert transaction', {
            status: 500,
            headers: corsHeaders,
        })));
    }
}