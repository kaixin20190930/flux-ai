import {type NextRequest} from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
        // 重定向到 Google OAuth 登录页面
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile`
        return Response.redirect(googleAuthUrl)
    }

    try {
        // 用 code 换取 access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                grant_type: 'authorization_code'
            })
        })

        const tokenData = await tokenResponse.json() as any

        // 获取用户信息
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {Authorization: `Bearer ${tokenData.access_token}`}
        })
        const userData = await userResponse.json()

        // 处理用户数据，创建会话等
        return Response.json(userData)
    } catch (error) {
        return Response.json({error: 'Authentication failed'}, {status: 400})
    }
}