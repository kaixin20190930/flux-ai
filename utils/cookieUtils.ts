import {logWithTimestamp} from './logUtils';
import {NextRequest} from 'next/server';
import {cookies} from 'next/headers'
import {serialize, CookieSerializeOptions, parse} from 'cookie';


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
        const cookieStore = cookies();
        cookieData = cookieStore.get(COOKIE_NAME as any)?.value;
        logWithTimestamp('Reading cookie header data from client', cookieData);

        // 客户端
        // cookieData = Cookies.get(COOKIE_NAME);
        // logWithTimestamp('Reading cookie data from client', {Cookies});
        // logWithTimestamp('Reading cookie data from client', {cookieData});
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

export function setCookie(name: string, value: string, options: Partial<CookieSerializeOptions> = {}): string {
    const defaultOptions: CookieSerializeOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
    };

    const cookieOptions = {...defaultOptions, ...options};

    return serialize(name, value, cookieOptions);
}


export function getCookieValue(cookieString: string, name: string): string | undefined {
    const cookies = parse(cookieString || '');
    return cookies[name];
}