import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import {logWithTimestamp} from "@/utils/logUtils";
import {getUserPoints, User} from "@/utils/userUtils";
import {getUserFromCookie} from "@/utils/authUtils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});
export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const {priceId} = await req.json() as any;
        const JWT_SECRET = process.env.JWT_SECRET as string;


        if (!JWT_SECRET) {
            logWithTimestamp('JWT_SECRET is not defined in environment variables');
            return NextResponse.json({error: 'JWT_SECRET is null'}, {status: 401} as any);
        }

        const user: User | null = await getUserFromCookie(req, JWT_SECRET);

        // 记录用户详情
        console.log('User from cookie:', user);

        if (!user || !user.userId) {
            console.error('No user found or userId is missing');
            return NextResponse.json({error: 'User not authenticated'}, {status: 402} as any);
        }

        const userId = user.userId;
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