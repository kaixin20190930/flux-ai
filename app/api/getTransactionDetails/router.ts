import {NextResponse} from 'next/server';
import {Env} from '../../../worker/types'
import {getTransaction} from "@/utils/userUtils";

export const runtime = 'edge';

export async function GET(req: Request, {env}: { env: Env }) {
    const {searchParams} = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({error: 'Session ID is required'}, {status: 400} as any);
    }

    try {
        const pointsAdded = await getTransaction(sessionId)

        return NextResponse.json({pointsAdded});
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500} as any);
    }
}