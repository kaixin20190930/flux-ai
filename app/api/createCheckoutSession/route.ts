import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {logWithTimestamp} from "@/utils/logUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
});

export async function POST(req: Request) {
    try {
        const {priceId} = await req.json() as any;
        logWithTimestamp('priceIs is:', priceId)
        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
        });
        return NextResponse.json({id: session.id});
    } catch (err: any) {
        return NextResponse.json({statusCode: 500, message: err.message}, {status: 500} as any);
    }
}