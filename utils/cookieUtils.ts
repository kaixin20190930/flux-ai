import Cookies from 'js-cookie';
import {logWithTimestamp} from './logUtils';
import {NextRequest} from 'next/server';

const COOKIE_NAME = 'fluxAIGenerations';

export interface GenerationData {
    count: number;
    date: string;
}

export function getGenerationData(req?: NextRequest): GenerationData {
    let cookieData: string | undefined;

    if (typeof window === 'undefined' && req) {
        // 服务器端
        cookieData = req.cookies.get(COOKIE_NAME as any)?.value;
        logWithTimestamp('Reading cookie data from server', {cookieData});
    } else {
        // 客户端
        cookieData = Cookies.get(COOKIE_NAME);
        logWithTimestamp('Reading cookie data from client', {Cookies});
        logWithTimestamp('Reading cookie data from client', {cookieData});
    }

    if (cookieData) {
        try {
            const parsedData = JSON.parse(cookieData);
            const today = new Date().toDateString();

            logWithTimestamp('Parsed cookie data', {parsedData, today});

            if (parsedData.date === today) {
                return parsedData;
            } else {
                logWithTimestamp('Cookie data is from a different day, resetting');
            }
        } catch (e) {
            logWithTimestamp('Error parsing cookie data', e);
        }
    } else {
        logWithTimestamp('No cookie data found');
    }

    // 如果没有有效的 cookie 数据或日期不是今天，返回默认值
    const defaultData = {count: 0, date: new Date().toDateString()};
    logWithTimestamp('Returning default data', defaultData);
    return defaultData;
}

export function setGenerationData(data: GenerationData): void {
    logWithTimestamp('Setting generation data', data);

    if (typeof window !== 'undefined') {
        // 客户端
        Cookies.set(COOKIE_NAME, JSON.stringify(data), {
            expires: 1, // 1 day
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });

        // 验证 cookie 是否被正确设置
        const verifyData = Cookies.get(COOKIE_NAME);
        logWithTimestamp('Verifying set cookie data (client)', {verifyData});
    } else {
        // 服务器端
        // 注意：在服务器端，我们不能直接设置 cookie。
        // 相反，我们应该在 API 路由中设置 Set-Cookie 头
        logWithTimestamp('Attempted to set cookie on server side');
    }
}