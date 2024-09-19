import {Env} from '../types';
import {hashPassword} from '@/utils/auth';
import {logWithTimestamp} from "@/utils/logUtils";

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handleRegister(request: Request, env: Env): Promise<Response> {
    logWithTimestamp('start register');
    logWithTimestamp('Database:', env.DB.toString());

    try {
        const {name, email, password} = await request.json() as any;

        if (!name || !email || !password) {
            return new Response('Missing required fields', {
                status: 400,
                headers: corsHeaders,
            });
        }

        const hashedPassword = await hashPassword(password);

        await env.DB.prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        )
            .bind(name, email, hashedPassword)
            .run();

        return new Response('User registered successfully', {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return new Response('Error registering user', {
            status: 500,
            headers: corsHeaders,
        });
    }
}
