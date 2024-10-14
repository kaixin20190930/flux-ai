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

        const response = await fetch('http://localhost:8787/getuserpoints', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        });

        logWithTimestamp('get response status is:', response.status)
        logWithTimestamp('get response ok is:', response.ok)

        if (response.ok) {
            const data = await response.json() as any;
            logWithTimestamp('get data points is:', data)
            return data.userPoints;
        } else {
            console.error('Error fetching user points');
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}