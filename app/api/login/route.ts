import {NextRequest} from 'next/server';
import {D1Database} from '@cloudflare/workers-types';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

export const runtime = 'edge';

export async function POST(request: NextRequest, ctx: { env: Env }) {
    const {email, password} = await request.json();

    try {
        const user = await ctx.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

        if (!user) {
            return Response.json({message: 'User not found'}, {status: 404});
        }

        const isValidPassword = await bcrypt.compare(password, user.password as any);

        if (!isValidPassword) {
            return Response.json({message: 'Invalid password'}, {status: 401});
        }

        const secret = new TextEncoder().encode(ctx.env.JWT_SECRET);
        const token = await new jose.SignJWT({userId: user.id})
            .setProtectedHeader({alg: 'HS256'})
            .setExpirationTime('1h')
            .sign(secret);

        const response = Response.json({message: 'Login successful', token}, {status: 200});
        response.headers.set(
            'Set-Cookie',
            `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`
        );

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({message: 'An error occurred during login'}, {status: 500});
    }
}