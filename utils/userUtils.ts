import {getUserFromCookie, getUserFromLocalStorage} from './authUtils';
import {NextRequest} from 'next/server';
import {Env} from '@/worker/types';
import {logWithTimestamp} from "@/utils/logUtils";
import {GET} from "@/app/api/getRemainingGenerations/route";
import {verifyJWT} from "@/utils/auth";
import {Data} from "@/components/AIImageGenerator";

// import os from 'os';


export interface User {
    userId: string;
    name: string;
    email: string;
    points: number;
    subscription_type: string | null;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    // 添加其他可能的用户属性
}

export interface Data2 {
    points: number;
}


export async function getUserPoints(req: NextRequest) {
    const token = req.cookies.get('token' as any)?.value;

    if (!token) {
        console.error('No token found');
        return null;
    }
    logWithTimestamp('start get user points')
    try {

        logWithTimestamp('Received token:', token);
        try {
            const decoded = await verifyJWT(token, process.env.JWT_SECRET as string);

            logWithTimestamp('Token verified successfully in getUserPoints');
        } catch (error) {
            logWithTimestamp('Token verification failed in getUserPoints:', error);
        }

        const response = await fetch('http://flux-ai.liukai19911010.workers.dev/getuserpoints', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        logWithTimestamp('get response status is:', response.status)
        logWithTimestamp('get response ok is:', response.ok)

        if (response.ok) {
            const data: Data2 = await response.json();
            logWithTimestamp('get data points is:', data)
            return data.points;
        } else {
            console.error('Error fetching user points');
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

export async function updateUserPoints(req: NextRequest, newPoints: number) {
    const token = req.cookies.get('token' as any)?.value;

    if (!token) {
        console.error('No token found');
        return false;
    }

    logWithTimestamp('Start updating user points');

    try {
        const response = await fetch('http://flux-ai.liukai19911010.workers.dev/updateuserpoints', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({points: newPoints})
        });

        if (response.ok) {
            const data: { success: boolean, points: number } = await response.json();
            logWithTimestamp('Update result:', data);
            return data.success;
        } else {
            console.error('Error updating user points');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}