// import * as bcrypt from 'bcryptjs';
// import * as jwt from '@tsndr/cloudflare-worker-jwt';
//
// export async function hashPassword(password: string): Promise<string> {
//     return bcrypt.hash(password, 10);
// }
//
// export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
//     return bcrypt.compare(password, hashedPassword);
// }
//
// export async function createJWT(payload: object, secret: string): Promise<string> {
//     return jwt.sign(payload, secret);
// }
//
// export async function verifyJWT(token: string, secret: string): Promise<any> {
//     return jwt.verify(token, secret);
// }
import * as bcrypt from 'bcryptjs';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import {logWithTimestamp} from "@/utils/logUtils";
import {JwtData} from "@tsndr/cloudflare-worker-jwt";

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function createJWT(payload: object, secret: string): Promise<string> {
    if (secret.length === 0) {
        throw new Error('JWT secret cannot be empty');
    }
    const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now
    const fullPayload = {
        ...payload,
        exp: expirationTime,
        iat: Math.floor(Date.now() / 1000)  // 添加签发时间
    };

    logWithTimestamp('Creating JWT with payload:', JSON.stringify(fullPayload));
    logWithTimestamp('JWT secret length:', secret.length);

    try {
        const token = await jwt.sign(fullPayload, secret);
        logWithTimestamp('Created JWT:', token);


        // 立即验证创建的 token
        const isValid = await jwt.verify(token, secret);
        logWithTimestamp('Immediate JWT verification result:', isValid);

        if (isValid) {
            const decoded = jwt.decode(token);
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

    await diagnoseJWT(token, secret);

    try {
        const decoded = jwt.decode(token);
        logWithTimestamp('Decoded JWT (without verification):', JSON.stringify(decoded));
        if (!decoded || !decoded.payload) {
            throw new Error('Invalid token structure');
        }
        const now = Math.floor(Date.now() / 1000);
        if (decoded.payload.exp && decoded.payload.exp < now) {
            throw new Error(`Token expired at ${new Date(decoded.payload.exp * 1000).toISOString()}, current time is ${new Date(now * 1000).toISOString()}`);
        }

        const isValid = await jwt.verify(token, secret);
        logWithTimestamp('JWT verification result:', isValid);

        return decoded.payload;

    } catch (error) {
        logWithTimestamp(`JWT verification or decoding failed: ${error}`);
        throw error;
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
            const decoded = jwt.decode(token) as any;
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
            const isValid = await jwt.verify(token, secret);
            console.log('JWT verification result:', isValid);
        } catch (error) {
            console.error('JWT verification failed:', error);
        }

        // 4. 单独验证签名
        try {
            const signingInput = parts[0] + '.' + parts[1];
            const signature = parts[2];
            const isSignatureValid = await jwt.verify(signingInput + '.' + signature, secret);
            console.log('Signature verification result:', isSignatureValid);
        } catch (error) {
            console.error('Signature verification failed:', error);
        }
    }
}