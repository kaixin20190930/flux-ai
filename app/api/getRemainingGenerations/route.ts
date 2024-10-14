import {NextRequest, NextResponse} from 'next/server';
import {getGenerationData} from '../../../utils/cookieUtils';
import {logWithTimestamp} from '../../../utils/logUtils';
import {getUserFromCookie, getUserFromLocalStorage} from '../../../utils/authUtils'; // 假设我们有这个函数来从 token 获取用户信息
import {getUserPoints, User} from '../../../utils/userUtils'; // 假设我们有这个函数来获取用户点数
import {Env} from '@/worker/types';


const MAX_DAILY_GENERATIONS = 3;

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        // 使用 process.env 而不是 env 参数
        const JWT_SECRET = process.env.JWT_SECRET;

        logWithTimestamp('process.env.JWT_SECRETis:', process.env.JWT_SECRET)

        logWithTimestamp('JWT_SECRET:', JWT_SECRET ? 'defined' : 'undefined');
        if (!JWT_SECRET) {
            logWithTimestamp('JWT_SECRET is not defined in environment variables');
            throw new Error('JWT_SECRET is not configured');
        }
        const generationData = getGenerationData();
        const today = new Date().toDateString();
        logWithTimestamp('Current generation data:', generationData);

        let remainingFreeGenerations;
        if (generationData.date !== today) {
            remainingFreeGenerations = MAX_DAILY_GENERATIONS;
        } else {
            remainingFreeGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);
        }

        logWithTimestamp('Remaining free generations:', remainingFreeGenerations);

        // 获取用户信息
        // const user: User | null = await getUserFromLocalStorage()
        const user: User | null = await getUserFromCookie(req, JWT_SECRET)
        logWithTimestamp('user info is:', user);
        let userPoints = null
        if (user) {
            userPoints = await getUserPoints(req)
            logWithTimestamp(`User ${user.userId} points:`, userPoints);
        }

        return Response.json({
            remainingFreeGenerations: remainingFreeGenerations,
            isLoggedIn: !!user,
            userPoints: userPoints
        });
    } catch (error) {
        console.error('Error in GET function:', error);
        return Response.json({error: 'An unexpected error occurred'}, {status: 500});
    }
}