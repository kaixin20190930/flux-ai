import {NextResponse} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';
import {Env} from '@/worker/types';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const runtime = 'edge';
export async function POST(req: Request, env: Env) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.');
        return NextResponse.json({error: (err as Error).message}, {status: 400} as any);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, env);
    }

    return NextResponse.json({received: true});
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, env: Env) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const item = lineItems.data[0];

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
        // Update user points
        const updateUserPointsResult = await env.DB
            .prepare('UPDATE users SET points = points + ? WHERE id = ?')
            .bind(pointsAdded, session.client_reference_id)
            .run();

        // Record the transaction
        const insertTransactionResult = await env.DB
            .prepare('INSERT INTO transactions (user_id, amount, points_added, stripe_session_id) VALUES (?, ?, ?, ?)')
            .bind(
                session.client_reference_id,
                item.amount_total ? item.amount_total / 100 : 0,
                pointsAdded,
                session.id
            )
            .run();

        console.log(`Added ${pointsAdded} points to user ${session.client_reference_id}`);
        console.log('Update result:', updateUserPointsResult);
        console.log('Insert result:', insertTransactionResult);
    } catch (error) {
        console.error('Error updating user points:', error);
    }
}
