import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {jwtVerify} from 'jose';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token' as any)?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    try {
        const {payload} = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        const response = NextResponse.next();
        response.headers.set('X-USER-ID', payload.userId as string);
        return response;
    } catch (error) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }
}

export const config = {
    matcher: ['/dashboard/:path*'],
};