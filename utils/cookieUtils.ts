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

    try {
        if (req) {
            // 服务器端 - 统一使用NextRequest的cookies
            cookieData = req.cookies.get(COOKIE_NAME)?.value;
            logWithTimestamp('Reading cookie data from server request', {cookieData});
        } else {
            // 服务器端 - 使用Next.js的cookies函数
            const cookieStore = cookies();
            cookieData = cookieStore.get(COOKIE_NAME)?.value;
            logWithTimestamp('Reading cookie data from server cookies', cookieData);
        }

        if (cookieData) {
            const parsedData = JSON.parse(cookieData);
            const today = new Date().toDateString();

            logWithTimestamp('Parsed cookie data', {parsedData, today});

            if (parsedData.date === today) {
                return parsedData;
            } else {
                logWithTimestamp('Cookie data is from a different day, resetting');
            }
        } else {
            logWithTimestamp('No cookie data found');
        }
    } catch (e) {
        logWithTimestamp('Error reading or parsing cookie data', e);
    }

    // 返回默认值
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