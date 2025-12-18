import { EdgeAuth } from '@/utils/edgeUtils';
import { logWithTimestamp } from "@/utils/logUtils";
import { Env } from '@/worker/types';
import * as workerJwt from '@tsndr/cloudflare-worker-jwt';

export async function hashPassword(password: string): Promise<string> {
    return EdgeAuth.hashPassword(password);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return EdgeAuth.verifyPassword(password, hashedPassword);
}

export async function createJWT(payload: object, secret: string): Promise<string> {
    if (secret.length === 0) {
        throw new Error('JWT secret cannot be empty');
    }
    const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    const fullPayload = {
        ...payload,
        exp: expirationTime,
        iat: Math.floor(Date.now() / 1000)  // 添加签发时间
    };

    logWithTimestamp('Creating JWT with payload:', JSON.stringify(fullPayload));
    logWithTimestamp('JWT secret length:', secret.length);

    try {
        const token = await workerJwt.sign(fullPayload, secret);
        logWithTimestamp('Created JWT:', token);

        // 立即验证创建的 token
        const isValid = await workerJwt.verify(token, secret);
        logWithTimestamp('Immediate JWT verification result:', isValid);

        if (isValid) {
            const decoded = workerJwt.decode(token);
            logWithTimestamp('Decoded JWT:', JSON.stringify(decoded));
        }

        return token;
    } catch (error) {
        logWithTimestamp('Error creating or verifying JWT:', error);
        throw error;
    }
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
    if (!token) {
        throw new Error('Token is required');
    }
    if (!secret || secret.length === 0) {
        throw new Error('JWT secret cannot be empty');
    }

    try {
        // 首先验证token
        const isValid = await workerJwt.verify(token, secret);
        logWithTimestamp('JWT verification result:', isValid);
        
        if (!isValid) {
            throw new Error('Token verification failed');
        }

        // 只有验证成功才解码
        const decoded = workerJwt.decode(token);
        logWithTimestamp('Decoded JWT:', JSON.stringify(decoded));
        
        if (!decoded || !decoded.payload) {
            throw new Error('Invalid token structure');
        }

        // 检查过期时间
        const now = Math.floor(Date.now() / 1000);
        if (decoded.payload.exp && decoded.payload.exp < now) {
            throw new Error(`Token expired at ${new Date(decoded.payload.exp * 1000).toISOString()}`);
        }

        return decoded.payload;

    } catch (error) {
        logWithTimestamp(`JWT verification failed: ${error}`);
        throw error;
    }
}

export async function getUserIdFromToken(token: string): Promise<number | null> {
    try {
        const decoded = await verifyJWT(token, process.env.JWT_SECRET as string);
        return decoded.userId;
    } catch (error) {
        console.error('Token验证失败:', error);
        return null;
    }
}

export async function getUserFromRequest(request: Request): Promise<any | null> {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                     new URL(request.url).searchParams.get('token');
        
        if (!token) {
            return null;
        }
        
        const decoded = await verifyJWT(token, process.env.JWT_SECRET as string);
        return decoded;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

export async function generateToken(userId: number, env: Env): Promise<string> {
    const payload = {
        userId,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天后过期
    };
    return createJWT(payload, env.JWT_SECRET);
}

export async function verifyUser(env: Env, userId: number): Promise<boolean> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
        return !!user;
    } catch (error) {
        console.error('用户验证失败:', error);
        return false;
    }
}

export async function isGoogleUser(env: Env, userId: number): Promise<boolean> {
    try {
        const db = env.DB || env['DB-DEV'];
        if (!db) throw new Error('No D1 database binding found!');
        const user = await db.prepare('SELECT is_google_user FROM users WHERE id = ?').bind(userId).first();
        return user?.is_google_user === 1;
    } catch (error) {
        console.error('获取用户类型失败:', error);
        return false;
    }
}

async function diagnoseJWT(token: string, secret: string) {
    console.log('Starting JWT diagnosis');

    // 1. 检查 token 格式
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.error('Invalid token format: Token should have three parts separated by dots');
        return;
    }

    // 2. 解码 token（不验证签名）
    try {
        const decoded = workerJwt.decode(token) as any;
        console.log('Decoded token:', decoded);

        // 检查过期时间
        if (decoded.payload.exp && decoded.payload.exp < Math.floor(Date.now() / 1000)) {
            console.error('Token has expired');
        }
    } catch (error) {
        console.error('Error decoding token:', error);
    }

    // 3. 尝试验证
    try {
        const isValid = await workerJwt.verify(token, secret);
        console.log('JWT verification result:', isValid);
    } catch (error) {
        console.error('JWT verification failed:', error);
    }

    // 4. 单独验证签名
    try {
        const signingInput = parts[0] + '.' + parts[1];
        const signature = parts[2];
        const isSignatureValid = await workerJwt.verify(signingInput + '.' + signature, secret);
        console.log('Signature verification result:', isSignatureValid);
    } catch (error) {
        console.error('Signature verification failed:', error);
    }
}
