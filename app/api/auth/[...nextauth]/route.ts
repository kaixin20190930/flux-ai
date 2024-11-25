import GoogleProvider from "next-auth/providers/google"
import NextAuth, {NextAuthOptions} from "next-auth";

export const runtime = 'edge';
const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    debug: false,
    callbacks: {
        async signIn({user, account, profile, email, credentials}) {
            return true
        },
        async redirect({url, baseUrl}) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    }
};
const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};