import {NextRequest, NextResponse} from 'next/server';
import {D1Database} from '@cloudflare/workers-types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

declare global {
    const DB: D1Database;
}

export async function POST(request: NextRequest) {
    const {email, password} = await request.json();

    try {
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

        if (!user) {
            return Response.json({message: 'User not found'}, {status: 404});
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return Response.json({message: 'Invalid password'}, {status: 401});
        }

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET as string, {expiresIn: '1h'});

        const response = NextResponse.json({message: 'Login successful', token});
        response.cookies.set('token' as any, token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600
        } as any);

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({message: 'An error occurred during login'}, {status: 500});
    }
}