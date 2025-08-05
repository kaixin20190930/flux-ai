// app/api/auth/google/callback/route.ts
import {NextRequest} from 'next/server'
import {cookies} from 'next/headers'
import axios from 'axios'

// 移除 edge runtime
// export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // 解析 state 获取语言设置
    let locale = 'en'
    try {
        const stateData = JSON.parse(state || '{}')
        locale = stateData.locale || 'en'
    } catch (error) {
        console.error('Error parsing state:', error)
    }

    if (!code) {
        return Response.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth?error=invalid_request`
        )
    }

    try {
        // 获取当前请求的完整 URL
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        const host = request.headers.get('host') || 'localhost:3000'
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`

        console.log('Using redirect URI:', redirectUri)

        // 1. 使用授权码获取访问令牌
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000 // 设置10秒超时
        })

        const tokenData = tokenResponse.data
        console.log('Token data:', tokenData)

        // 2. 获取用户信息
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            },
            timeout: 10000 // 设置10秒超时
        })

        const userData = userResponse.data
        console.log('User data:', userData)

        // 3. 使用现有的登录接口
        const workerUrl = 'https://flux-ai.liukai19911010.workers.dev'
        const origin = process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.NODE_ENV === 'production' 
                ? 'https://flux-ai-img.com'
                : 'http://localhost:3000')

        try {
            const loginResponse = await axios.post(`${workerUrl}/login`, {
                email: userData.email,
                googleToken: tokenData.access_token
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': origin
                },
                timeout: 10000 // 设置10秒超时
            })

            const data = loginResponse.data
            console.log('Login data:', data)

            // 设置 cookie
            cookies().set('token', data.token, {
                httpOnly: true,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            })

            return Response.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/success?user=${encodeURIComponent(JSON.stringify(data.user))}`
            )
        } catch (loginError) {
            console.error('Login error:', loginError)
            // 如果登录失败，尝试注册
            try {
                const registerResponse = await axios.post(`${workerUrl}/register`, {
                    name: userData.name,
                    email: userData.email,
                    googleToken: tokenData.access_token
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Origin': origin
                    },
                    timeout: 10000 // 设置10秒超时
                })

                const data = registerResponse.data
                console.log('Register data:', data)

                // 设置 cookie
                cookies().set('token', data.token, {
                    httpOnly: true,
                    path: '/',
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production'
                })

                return Response.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/success?user=${encodeURIComponent(JSON.stringify(data.user))}`
                )
            } catch (registerError) {
                console.error('Register error:', registerError)
                return Response.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth?error=auth_failed`
                )
            }
        }
    } catch (error) {
        console.error('Google authentication error:', error)
        return Response.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth?error=google_auth_failed`
        )
    }
}
