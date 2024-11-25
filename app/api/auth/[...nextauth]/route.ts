import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({token, user, account}) {
            // 当用户首次登录时，将获得的信息添加到 token 中
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    },
                }
            }
            return token
        },
        async session({session, token}) {
            // 将 token 中的信息添加到 session 中
            session.user = token.user as any
            session.accessToken = token.accessToken as string
            return session
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
})

export {handler as GET, handler as POST}