import {NextRequest, NextResponse} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';
import {logWithTimestamp} from "@/utils/logUtils";
import {insertTransaction, updateUserPurchase} from "@/utils/prismaUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
    httpClient: Stripe.createFetchHttpClient()
});

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
}

interface ResponseForWebhook {
    signature_status: string;
    event_status: string
    points_status: string;
    transaction_status: string
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const dynamic = 'force-dynamic';

// ❌ 移除 Edge Runtime（因为现在使用 Prisma）
// export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;
    let responseForWebhook: ResponseForWebhook = {
        signature_status: '',
        event_status: '',
        points_status: '',
        transaction_status: ''
    };
    if (!signature) {
        console.error('No Stripe signature found');
        return NextResponse.json({error: 'No Stripe signature'}, {status: 400} as any);
    }
    responseForWebhook.signature_status = 'signature success'
    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        responseForWebhook.event_status = 'event success'
    } catch (err) {
        console.error('Webhook signature verification failed.', err);
        return NextResponse.json({error: (err as Error).message}, {status: 400} as any);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            logWithTimestamp('start checkout session:')
            const result = await handleCheckoutSessionCompleted(session, req);
            logWithTimestamp('get result is:', result)
            responseForWebhook.points_status = result.points_status;
            responseForWebhook.transaction_status = result.transaction_status;
            logWithTimestamp('end checkout session:')
        }

        return NextResponse.json(responseForWebhook);
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({error: 'Webhook processing failed'}, {status: 500} as any);
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, req: NextRequest) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const item = lineItems.data[0];
    let points_status = 'init value';
    let transaction_status = 'init value';

    if (!item) {
        console.error('No line items found for session', session.id);
        return {points_status: 'item failed', transaction_status: 'item failed'};
    }

    const pointsMap: { [key: string]: number } = {
        'price_basic': 200,
        // Add more price IDs and their corresponding points
    };

    const pointsAdded = 200;

    try {
        logWithTimestamp('start update user points:', pointsAdded)

        points_status = await updateUserPurchase(pointsAdded, session.client_reference_id ?? '');
        // } else {
        //     console.error('Error updating user points');
        // }

        const transaction: Transaction = {
            client_reference_id: session.client_reference_id ?? '',
            amount_total: (session.amount_total ?? 0) / 100,
            points_added: pointsAdded,
            session_id: session.id ?? ''
        };

        // const insertResponse = await fetch('https://flux-ai.liukai19911010.workers.dev/inserttransaction', {
        //     method: 'POST',
        //     headers: {
        //         // 'Authorization': `Bearer ${token}`,
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(transaction)
        // });
        //
        // if (insertResponse.ok) {
        transaction_status = await insertTransaction(transaction);
        // } else {
        //     console.error('Error inserting transaction');
        // }

    } catch (error) {
        console.error('Error processing checkout session:', error);
    }

    return {points_status, transaction_status};
}
