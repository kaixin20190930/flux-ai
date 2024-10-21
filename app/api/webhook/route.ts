import {NextRequest, NextResponse} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';
import {Env} from '@/worker/types';
import {logWithTimestamp} from "@/utils/logUtils";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
    httpClient: Stripe.createFetchHttpClient()
});

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
    // 添加其他可能的用户属性
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    if (!signature) {
        console.error('No Stripe signature found');
        return NextResponse.json({error: 'No Stripe signature'}, {status: 400} as any);
    }
    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.', err);
        return NextResponse.json({error: (err as Error).message}, {status: 400} as any);
    }

    try {
        logWithTimestamp('start checkout session:')
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            logWithTimestamp('start checkout session:')
            await handleCheckoutSessionCompleted(session, req);
            logWithTimestamp('end checkout session:')

        }

        return NextResponse.json({received: true});
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({error: 'Webhook processing failed'}, {status: 500} as any);
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, req: NextRequest) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const item = lineItems.data[0];
    const token = req.cookies.get('token' as any)?.value;

    if (!item) {
        console.error('No line items found for session', session.id);
        return;
    }

    const pointsMap: { [key: string]: number } = {
        'price_basic': 200,
        // Add more price IDs and their corresponding points
    };

    const pointsAdded = pointsMap[item.price?.id ?? ''] || 0;

    try {
        logWithTimestamp('start update user points:')

        // Update user points
        const response = await fetch('http://flux-ai.liukai19911010.workers.dev/updateuserpoints', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({points: pointsAdded})
        });

        if (response.ok) {
            const data: { success: boolean, points: number } = await response.json();
            logWithTimestamp('Update result:', data);
            return data.success;
        } else {
            console.error('Error updating user points');
            return false;
        }

        const transaction: Transaction = {
            client_reference_id: session.client_reference_id ?? '',
            amount_total: session?.amount_total != null ? session.amount_total / 100 : 0,
            points_added: pointsAdded,
            session_id: session.id ?? ''
        };

        const insertResponse = await fetch('http://flux-ai.liukai19911010.workers.dev/inserttransaction', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
        });

        // Record the transaction
        if (!insertResponse.ok) {
            throw new Error('Failed to insert transaction record');
        }

        const insertResult = await insertResponse.json();
        logWithTimestamp('Insert result:', insertResult);

        console.log(`Added ${pointsAdded} points to user ${session.client_reference_id}`);
    } catch (error) {
        console.error('Error processing checkout session:', error);
        throw error;
    }
}
