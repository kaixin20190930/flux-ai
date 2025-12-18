import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import {logWithTimestamp} from "@/utils/logUtils";
import {auth} from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
});

export const dynamic = 'force-dynamic'


// 强制使用 Edge Runtime (Cloudflare Pages 要求)
// 注意：不使用 edge runtime，因为 NextAuth database sessions 需要 Prisma
// Prisma 不支持 Edge Runtime
export async function POST(req: NextRequest) {
    try {
        const {priceId} = await req.json() as any;
        
        // Check authentication using NextAuth
        const authSession = await auth();
        
        if (!authSession?.user) {
            console.error('No user found or user not authenticated');
            return NextResponse.json({error: 'User not authenticated'}, {status: 401} as any);
        }

        const userId = authSession.user.id;
        console.log('User ID:', userId);
        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
            client_reference_id: userId,

        });
        return NextResponse.json({id: session.id});
    } catch (err: any) {
        return NextResponse.json({statusCode: 500, message: err.message}, {status: 500} as any);
    }
}