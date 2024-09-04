import {NextRequest, NextResponse} from 'next/server';
import {D1Database} from '@cloudflare/workers-types';
import bcrypt from 'bcryptjs';

declare global {
    const DB: D1Database;
}

export async function POST(request: NextRequest) {
    const {name, email, password} = await request.json();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await DB.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
            .bind(name, email, hashedPassword)
            .run();

        if (result.success) {
            return Response.json({message: 'User registered successfully'}, {status: 201});
        } else {
            return Response.json({message: 'Failed to register user'}, {status: 500});
        }
    } catch (error) {
        console.error('Registration error:', error);
        return Response.json({message: 'An error occurred during registration'}, {status: 500});
    }
}