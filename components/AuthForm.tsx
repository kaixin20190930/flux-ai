// components/AuthForm.tsx
'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CredentialResponse } from '@react-oauth/google'
import GoogleOAuthButton from './GoogleOAuthButton'
import { apiClient } from '@/lib/api-client'
import { getGoogleOAuthErrorMessage, GoogleOAuthErrorCode } from '@/lib/google-oauth-errors'

interface AuthFormProps {
    dictionary: any
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
}

interface SuccessMessage {
    message: string;
    show: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({dictionary}) => {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [successMessage, setSuccessMessage] = useState<SuccessMessage>({ message: '', show: false })
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const params = useParams()
    const router = useRouter()
    const currentLocale = params.locale || 'en'
    const { login, register } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors and success messages
        setFormErrors({});
        setSuccessMessage({ message: '', show: false });
        setLoading(true);

        try {
            if (isLogin) {
                // Login with new auth system
                await login(email, password);
                setSuccessMessage({
                    message: dictionary.auth?.success?.loginSuccess || 'Welcome back! Redirecting...',
                    show: true
                });
            } else {
                // Register with new auth system
                await register(name, email, password);
                setSuccessMessage({
                    message: dictionary.auth?.success?.registerSuccess || 'Account created successfully! Redirecting...',
                    show: true
                });
            }

            // Redirect to create page on success after a short delay
            setTimeout(() => {
                router.push(`/${currentLocale}/create`);
                router.refresh();
            }, 1500);

        } catch (err: any) {
            console.error('Error during authentication:', err);
            setFormErrors({ 
                general: err.message || dictionary.auth.errors.unexpected || 'An unexpected error occurred. Please try again.' 
            });
            setLoading(false);
        }
    }

    /**
     * 处理 Google OAuth 登录
     * 
     * OAuth 流程说明：
     * 1. GoogleOAuthButton 组件触发 Google 授权
     * 2. 用户在 Google 页面完成授权
     * 3. Google 返回 JWT credential (包含用户信息)
     * 4. 解码 JWT 获取用户邮箱和姓名
     * 5. 调用后端 API (/auth/google-login) 完成登录/注册
     * 6. 后端验证 Google token 并创建/登录用户
     * 7. 返回 JWT token 并存储到 localStorage
     * 8. 跳转到创建页面
     * 
     * 安全性：
     * - Google token 在后端验证，确保真实性
     * - 前端只传递 token，不信任解码的用户信息
     * - 后端会再次调用 Google API 验证 token
     * 
     * @param credentialResponse - Google 返回的凭证响应
     */
    const handleGoogleSignIn = async (credentialResponse: CredentialResponse) => {
        // 清除之前的错误和成功消息
        setFormErrors({});
        setSuccessMessage({ message: '', show: false });
        setGoogleLoading(true);

        try {
            console.log('[AuthForm] Google sign in started');
            
            // 步骤 1: 检查是否有 credential
            if (!credentialResponse.credential) {
                throw new Error(getGoogleOAuthErrorMessage(GoogleOAuthErrorCode.GOOGLE_TOKEN_INVALID, dictionary));
            }

            // 步骤 2: 解码 JWT token 获取用户信息
            // 注意：这只是为了显示用户信息，实际验证在后端完成
            const base64Url = credentialResponse.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);

            console.log('[AuthForm] Decoded Google user info:', {
                email: payload.email,
                name: payload.name
            });

            // 步骤 3: 调用后端 API 完成登录/注册
            // 后端会：
            // 1. 验证 Google token 的有效性
            // 2. 检查用户是否存在
            // 3. 如果不存在，创建新用户并赠送 3 积分
            // 4. 生成 JWT token
            // 5. 返回用户信息和 token
            const response = await apiClient.googleLogin({
                googleToken: credentialResponse.credential,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0]
            });

            console.log('[AuthForm] Google login successful:', response);

            // 步骤 4: 显示成功提示
            setSuccessMessage({
                message: dictionary.auth?.success?.googleLoginSuccess || 'Signed in with Google successfully!',
                show: true
            });

            // 步骤 5: 跳转到创建页面（延迟以显示成功消息）
            setTimeout(() => {
                router.push(`/${currentLocale}/create`);
                router.refresh();
            }, 1500);

        } catch (err: any) {
            console.error('[AuthForm] Google sign in error:', err);
            
            // 错误处理：解析错误码并获取对应的本地化错误消息
            let errorMessage = err.message;
            
            // 如果错误响应包含错误码，使用错误码获取本地化消息
            if (err.response?.data?.error?.code) {
                errorMessage = getGoogleOAuthErrorMessage(
                    err.response.data.error.code,
                    dictionary
                );
            } else if (err.code === 'ERR_NETWORK') {
                // 网络错误
                errorMessage = getGoogleOAuthErrorMessage(GoogleOAuthErrorCode.NETWORK_ERROR, dictionary);
            } else if (err.code === 'ECONNABORTED') {
                // 超时错误
                errorMessage = getGoogleOAuthErrorMessage(GoogleOAuthErrorCode.TIMEOUT_ERROR, dictionary);
            } else if (!errorMessage || errorMessage === 'Google authentication failed') {
                // 通用 Google 认证失败
                errorMessage = getGoogleOAuthErrorMessage(GoogleOAuthErrorCode.GOOGLE_AUTH_FAILED, dictionary);
            }
            
            setFormErrors({
                general: errorMessage
            });
        } finally {
            setGoogleLoading(false);
        }
    }

    /**
     * 处理 Google OAuth 错误
     * 当 GoogleOAuthButton 组件检测到错误时调用
     * 
     * 可能的错误场景：
     * - 用户取消授权
     * - Google 服务不可用
     * - 网络连接失败
     * 
     * @param error - 错误消息
     */
    const handleGoogleError = (error: string) => {
        console.error('[AuthForm] Google OAuth error:', error);
        setFormErrors({
            general: error
        });
        setGoogleLoading(false);
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
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

                    {formErrors.general && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{formErrors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {successMessage.show && (
                        <div className="rounded-md bg-green-50 p-4 animate-fade-in">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{successMessage.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {formErrors.email && (
                        <div className="rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{formErrors.email}</p>
                        </div>
                    )}

                    {formErrors.password && (
                        <div className="rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{formErrors.password}</p>
                        </div>
                    )}

                    {formErrors.name && (
                        <div className="rounded-md bg-red-50 p-3">
                            <p className="text-sm text-red-800">{formErrors.name}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {dictionary.auth?.loading || 'Processing...'}
                                </span>
                            ) : (
                                isLogin ? dictionary.auth.signInButton : dictionary.auth.registerButton
                            )}
                        </button>
                    </div>
                </form>
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">
                                {dictionary.auth.continueWith || 'Or continue with'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <GoogleOAuthButton
                            onSuccess={handleGoogleSignIn}
                            onError={handleGoogleError}
                            dictionary={dictionary}
                            disabled={googleLoading || loading}
                        />
                        {googleLoading && (
                            <div className="mt-3 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                <span className="ml-2 text-sm text-gray-600">
                                    {dictionary.auth?.loading || 'Loading...'}
                                </span>
                            </div>
                        )}
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
