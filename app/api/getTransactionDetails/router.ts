import {NextResponse} from 'next/server';
import {Env} from '../../../worker/types'

export const runtime = 'edge';

export async function GET(req: Request, {env}: { env: Env }) {
    const {searchParams} = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({error: 'Session ID is required'}, {status: 400} as any);
    }

    try {
        const {results} = await env.DB.prepare(
            'SELECT points_added FROM transactions WHERE stripe_session_id = ?'
        )
            .bind(sessionId)
            .all();

        if (!results || results.length === 0) {
            return NextResponse.json({error: 'Transaction not found'}, {status: 404} as any);
        }

        const transaction = results[0];
        return NextResponse.json({pointsAdded: transaction.points_added});
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500} as any);
    }
}