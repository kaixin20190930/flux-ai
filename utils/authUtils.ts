import * as jwt from '@tsndr/cloudflare-worker-jwt';
import {NextRequest} from 'next/server';
import {Env} from '@/worker/types';
import {User} from "@/utils/userUtils";
import {logWithTimestamp} from "@/utils/logUtils";
import {verifyJWT} from "@/utils/auth";
import * as process from "process";
import {getCookieValue} from "@/utils/cookieUtils";


export async function getUserFromLocalStorage() {
    if (typeof window === 'undefined') {
        return null; // 如果在服务器端运行，返回 null
    }

    const userString = localStorage.getItem('user');
    if (!userString)
        return null;
    try {
        const user: User = JSON.parse(userString);
        return user;
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
    }
}

export async function getUserFromCookie(req: NextRequest, JWT_SECRET): Promise<User | null> {

    const token = req.cookies.get('token' as any)?.value.toString();

    if (!token) {
        return null;
    }
    logWithTimestamp('token is ', token)

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        const decoded = await verifyJWT(token, JWT_SECRET);
        logWithTimestamp('Decoded token content:', JSON.stringify(decoded, null, 2));

        return decoded as User;
    } catch (error) {
        logWithTimestamp(`Error verifying or decoding token: ${error}`);
        return null;
    }
}
