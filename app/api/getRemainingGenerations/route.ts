import {NextRequest, NextResponse} from 'next/server';
import {getGenerationData, setGenerationData} from '../../../utils/cookieUtils';
import {logWithTimestamp} from '../../..//utils/logUtils';

const MAX_DAILY_GENERATIONS = 3;
export const runtime = 'edge';
export async function GET(req: NextRequest) {
    const generationData = getGenerationData();
    const today = new Date().toDateString();
    logWithTimestamp('Current generation data:', generationData); // 添加日志

    let remainingGenerations;
    if (generationData.date !== today) {
        remainingGenerations = MAX_DAILY_GENERATIONS;
    } else {
        remainingGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);
    }

    logWithTimestamp('Remaining generations:', remainingGenerations); // 添加日志

    return NextResponse.json({remainingGenerations});
}