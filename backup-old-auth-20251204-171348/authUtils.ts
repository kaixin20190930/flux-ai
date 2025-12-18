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

export async function getUserFromCookie(req: NextRequest, JWT_SECRET: string): Promise<User | null> {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            logWithTimestamp('No token found in cookies');
            return null;
        }
        
        if (!JWT_SECRET) {
            logWithTimestamp('JWT_SECRET is not configured');
            return null;
        }

        const decoded = await verifyJWT(token, JWT_SECRET);
        logWithTimestamp('Successfully decoded token for user:', decoded.userId);

        return decoded as User;
    } catch (error) {
        logWithTimestamp(`Token verification failed: ${error}`);
        return null;
    }
}

/**
 * 验证用户是否具有管理员权限
 * @param sessionToken 会话令牌
 * @returns 是否为管理员
 */
export async function getUserFromRequest(request: Request): Promise<User | null> {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return null;
        }
        
        if (!process.env.JWT_SECRET) {
            return null;
        }
        
        const decoded = await verifyJWT(token, process.env.JWT_SECRET);
        return decoded as User;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

export async function verifyToken(token: string): Promise<User | null> {
    try {
        if (!process.env.JWT_SECRET) {
            return null;
        }
        
        const decoded = await verifyJWT(token, process.env.JWT_SECRET);
        return decoded as User;
    } catch (error) {
        console.error('Token验证失败:', error);
        return null;
    }
}

export async function verifyAdminAccess(sessionToken: string): Promise<boolean> {
    try {
        // 从环境变量获取管理员用户ID列表
        const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',') : [];
        
        // 解析会话令牌获取用户信息
        const JWT_SECRET = process.env.JWT_SECRET || '';
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }
        
        const decoded = await verifyJWT(sessionToken, JWT_SECRET);
        const userId = decoded.id || decoded.sub;
        
        // 检查用户ID是否在管理员列表中
        return ADMIN_USER_IDS.includes(userId);
    } catch (error) {
        logWithTimestamp(`Error verifying admin access: ${error}`);
        return false;
    }
}

/**
 * 检查用户是否已登录（仅检查JWT token，不依赖外部API）
 * @param req NextRequest对象
 * @param JWT_SECRET JWT密钥
 * @returns 用户信息或null
 */
export async function checkUserLoginStatus(req: NextRequest, JWT_SECRET: string): Promise<User | null> {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return null;
        }
        
        if (!JWT_SECRET) {
            return null;
        }

        const decoded = await verifyJWT(token, JWT_SECRET);
        logWithTimestamp('JWT verification successful for user:', decoded.userId);

        return decoded as User;
    } catch (error) {
        logWithTimestamp(`JWT verification failed: ${error}`);
        return null;
    }
}
