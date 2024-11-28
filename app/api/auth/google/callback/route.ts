// app/api/auth/google/callback/route.ts
import {NextRequest} from 'next/server'
import {cookies} from 'next/headers'
import {setCookie} from "@/utils/cookieUtils";

export const runtime = 'edge';

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

        if (!tokenResponse.ok) {
            return Response.redirect(
                `/${locale}/auth?error=token_error`
            )
        }

        const tokenData = await tokenResponse.json()

        // 2. 获取用户信息
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {Authorization: `Bearer ${tokenData.access_token}`},
        })

        if (!userResponse.ok) {
            return Response.redirect(
                `/${locale}/auth?error=user_info_error`
            )
        }

        const userData = await userResponse.json()

        // 3. 使用现有的登录接口
        const workerUrl = 'https://flux-ai.liukai19911010.workers.dev'
        const loginResponse = await fetch(`${workerUrl}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: userData.email,
                googleToken: tokenData.access_token // 使用 Google token 作为验证
            }),
        })

        if (loginResponse.ok) {
            const data = await loginResponse.json()

            // 设置 cookie 和返回重定向
            setCookie('token', data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            })

            // 需要设置 localStorage，通过注入脚本实现
            const script = `
                <script>
                    localStorage.setItem('user', '${JSON.stringify(data.user)}');
                    window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/${locale}/flux-1-1-ultra';
                </script>
            `;

            return new Response(script, {
                headers: {
                    'Content-Type': 'text/html',
                },
            });
        } else {
            // 如果登录失败，尝试注册
            const registerResponse = await fetch(`${workerUrl}/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    googleToken: tokenData.access_token // 使用 Google token 作为验证
                }),
            })

            if (registerResponse.ok) {
                const data = await registerResponse.json()

                // 设置 cookie 和返回重定向
                setCookie('token', data.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                })

                const script = `
                    <script>
                        localStorage.setItem('user', '${JSON.stringify(data.user)}');
                        window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/${locale}/flux-1-1-ultra';
                    </script>
                `;

                return new Response(script, {
                    headers: {
                        'Content-Type': 'text/html',
                    },
                });
            }
        }

        // 如果都失败了，返回错误
        return Response.redirect(
            `/${locale}/auth?error=auth_failed`
        )

    } catch (error) {
        console.error('Google authentication error:', error)
        return Response.redirect(
            `/${locale}/auth?error=google_auth_failed`
        )
    }
}