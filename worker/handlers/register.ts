import {Env} from '../types';
import {hashPassword} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

export async function handleRegister(request: Request, env: Env): Promise<Response> {
    const {username, email, password} = await request.json();

    logWithTimestamp('start register');

    if (!username || !email || !password) {
        return new Promise((resolve) => resolve(new Response('Missing required fields', {status: 400})));
    }

    const hashedPassword = await hashPassword(password);

    try {
        await env.DB.prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        )
            .bind(username, email, hashedPassword)
            .run();

        return new Promise((resolve) => resolve(new Response('User registered successfully', {
            status: 201, headers: {
                'Content-Type': 'application/json',
            }
        },)));
    } catch (error) {
        console.error('Registration error:', error);
        return new Promise((resolve) => resolve(new Response('Error registering user', {status: 500})));
    }
}