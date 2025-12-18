// components/AuthForm.tsx
'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface AuthFormProps {
    dictionary: any
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({dictionary}) => {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [loading, setLoading] = useState(false)
    const params = useParams()
    const router = useRouter()
    const currentLocale = params.locale || 'en'
    const { login, register } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setFormErrors({});
        setLoading(true);

        try {
            if (isLogin) {
                // Login with new auth system
                await login(email, password);
            } else {
                // Register with new auth system
                await register(name, email, password);
            }

            // Redirect to create page on success
            router.push(`/${currentLocale}/create`);
            router.refresh();

        } catch (err: any) {
            console.error('Error during authentication:', err);
            setFormErrors({ 
                general: err.message || dictionary.auth.errors.unexpected || 'An unexpected error occurred. Please try again.' 
            });
            setLoading(false);
        }
    }

    const handleGoogleSignIn = () => {
        // TODO: Implement Google OAuth with new auth system
        alert('Google OAuth 登录功能正在开发中，请使用邮箱密码登录');
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
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (isLogin ? dictionary.auth.signInButton : dictionary.auth.registerButton)}
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
                            onClick={handleGoogleSignIn}
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
