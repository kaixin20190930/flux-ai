// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import type {Session, Token} from 'next-auth'

export const runtime = 'edge';

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({token, user, account}) {
            // 如果是新登录，可以在这里添加额外的用户信息
            if (account && user) {
                token.accessToken = account.access_token;
                // 可以在这里调用你的 worker API 进行用户注册
                try {
                    const workerUrl = 'https://flux-ai.liukai19911010.workers.dev';
                    const response = await fetch(`${workerUrl}/register`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            name: user.name,
                            email: user.email,
                            // 可以生成一个随机密码，因为用户使用 Google 登录
                            password: Math.random().toString(36).slice(-8),
                            provider: 'google'
                        }),
                    });

                    if (response.ok) {
                        const userData = await response.json() as any;
                        token.customToken = userData.token;
                    }
                } catch (error) {
                    console.error('Error registering user:', error);
                }
            }
            return token;
        },
        async session({session, token}: { session: Session, token: Token }) {
            // 将 token 中的信息传递到 session
            if (token) {
                session.accessToken = token.accessToken;
                session.customToken = token.customToken;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth', // 指向你的自定义登录页
    }
})

export {handler as GET, handler as POST}