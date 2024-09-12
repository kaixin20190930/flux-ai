import * as bcrypt from 'bcryptjs';
import * as jwt from '@tsndr/cloudflare-worker-jwt';

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function createJWT(payload: object, secret: string): Promise<string> {
    return jwt.sign(payload, secret);
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
    return jwt.verify(token, secret);
}