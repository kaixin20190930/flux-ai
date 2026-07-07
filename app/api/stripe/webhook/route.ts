import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-09-30.acacia',
});

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  const fulfillSecret = process.env.STRIPE_FULFILL_SECRET;
  const userId = session.metadata?.userId || session.client_reference_id;
  const points = Number(session.metadata?.points || 0);
  const source = session.metadata?.source || 'pricing_page';

  if (!workerUrl || !fulfillSecret) {
    throw new Error('Worker fulfillment is not configured');
  }

  if (!userId || !points || points <= 0 || !session.id) {
    throw new Error('Invalid checkout session metadata');
  }

  const response = await fetch(`${workerUrl}/points/stripe-fulfill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-stripe-fulfill-secret': fulfillSecret,
    },
    body: JSON.stringify({
      userId,
      points,
      sessionId: session.id,
      amountTotal: session.amount_total || 0,
      currency: session.currency || 'usd',
      source,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker fulfillment failed: ${text}`);
  }

  const result = await response.json() as {
    success?: boolean;
    alreadyFulfilled?: boolean;
    points?: number;
    creditedPoints?: number;
    transactionId?: string;
    sessionId?: string;
    userId?: string;
  };

  console.info('Stripe webhook fulfillment result:', {
    sessionId: session.id,
    userId,
    points,
    alreadyFulfilled: Boolean(result.alreadyFulfilled),
    transactionId: result.transactionId || null,
    creditedPoints: result.creditedPoints ?? points,
    balance: result.points ?? null,
  });

  return result;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Invalid Stripe signature',
    }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await fulfillCheckoutSession(session);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook fulfillment error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Webhook fulfillment failed',
    }, { status: 500 });
  }
}
