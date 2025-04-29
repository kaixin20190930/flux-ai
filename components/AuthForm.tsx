// components/AuthForm.tsx
'use client'

import React, {useState} from 'react'
import {useRouter, useParams} from 'next/navigation'
import {logWithTimestamp} from "@/utils/logUtils"
import Cookies from 'js-cookie'
import type {Dictionary} from '@/app/i18n/settings'

interface AuthFormProps {
    dictionary: Dictionary
}

interface GoogleOAuthConfig {
    client_id: string;
    redirect_uri: string;
    scope: string;
    response_type: string;
}

const AuthForm: React.FC<AuthFormProps> = ({dictionary}) => {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const params = useParams()
    const currentLocale = params.locale as string

    const googleOAuthConfig: GoogleOAuthConfig = {
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        scope: 'email profile',
        response_type: 'code'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const endpoint = 'https://flux-ai.liukai19911010.workers.dev/login'
        const body = isLogin ? {email, password} : {name, email, password}

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            })

            logWithTimestamp('endpoint:' + endpoint)
            logWithTimestamp('get response from worker is:' + response.ok)

            if (response.ok) {
                const data = await response.json() as any
                logWithTimestamp('response is:' + JSON.stringify(data))

                if (data.token && data.user) {
                    // 统一使用 cookie 存储
                    Cookies.set('token', data.token, {
                        expires: 7,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    })
                    Cookies.set('user', JSON.stringify(data.user), {
                        expires: 7,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    })
                    logWithTimestamp('user data: ' + JSON.stringify(data.user))

                    // 保持语言设置的路由跳转
                    router.push(`/${currentLocale}/flux-1-1-ultra`)
                } else {
                    setError(dictionary.auth.errors.invalidFormat)
                }
            } else {
                const errorData = await response.json() as any
                setError(errorData.message || dictionary.auth.errors.authFailed)
            }
        } catch (err) {
            logWithTimestamp('Error during authentication:', err)
            setError(dictionary.auth.errors.unexpected)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            // 在状态中加入当前语言
            const state = JSON.stringify({
                locale: currentLocale
            })

            // 构建 Google OAuth URL
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
                client_id: googleOAuthConfig.client_id,
                redirect_uri: googleOAuthConfig.redirect_uri,
                response_type: googleOAuthConfig.response_type,
                scope: googleOAuthConfig.scope,
                prompt: 'select_account',
                state: state // 传递状态参数
            }).toString()}`

        } catch (err) {
            setError(dictionary.auth.errors.unexpected)
            logWithTimestamp('Error during Google authentication:' + err)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? dictionary.auth.signIn : dictionary.auth.createAccount}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    {dictionary.auth.fullName}
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required={!isLogin}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder={dictionary.auth.fullName}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                {dictionary.auth.emailAddress}
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                                    isLogin ? 'rounded-t-md' : ''
                                } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                                placeholder={dictionary.auth.emailAddress}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                {dictionary.auth.password}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder={dictionary.auth.password}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : isLogin ? dictionary.auth.signInButton : dictionary.auth.registerButton}
                        </button>
                    </div>
                </form>
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full inline-flex justify-center items-center px-4 py-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <img
                                src="/icons/google.svg"
                                alt="Google"
                                className="h-5 w-5"
                            />
                        </button>
                    </div>
                </div>
                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        {isLogin ? dictionary.auth.noAccount : dictionary.auth.hasAccount}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AuthForm