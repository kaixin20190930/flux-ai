// app/api/auth/google/callback/route.ts
import {NextRequest} from 'next/server'
import {cookies} from 'next/headers'
import {setCookie} from "@/utils/cookieUtils";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const locale = searchParams.get('locale') || 'en' // 获取语言参数

    if (!code) {
        return Response.redirect(
            `/${locale}/auth?error=invalid_request`
        )
    }

    try {
        // 1. 使用授权码获取访问令牌
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                code,
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        })
        if (tokenResponse.status !== 200) {
            const error = await tokenResponse.text()
            console.error('Token error:', error)
            return Response.redirect(
                `/${locale}/auth?error=token_error`
            )
        }

        const tokenData = await tokenResponse.json() as any

        // 2. 获取用户信息
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {Authorization: `Bearer ${tokenData.access_token}`},
        })
        if (userResponse.status !== 200) {
            const error = await userResponse.text()
            console.error('User info error:', error)
            return Response.redirect(
                `/${locale}/auth?error=user_info_error`
            )
        }
        const userData = await userResponse.json() as any

        // 3. 调用你的 worker API
        const workerResponse = await fetch('https://flux-ai.liukai19911010.workers.dev/google-auth', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: userData.email,
                name: userData.name,
                picture: userData.picture
            }),
        })

        const workerData = await workerResponse.json() as any

        // 4. 设置 cookie
        setCookie('token', workerData.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        })

        // 5. 重定向到带有语言的路由
        return Response.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/flux-1-1-ultra`
        )

    } catch (error) {
        console.error('Google authentication error:', error)
        return Response.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth?error=GoogleAuthFailed`
        )
    }
}