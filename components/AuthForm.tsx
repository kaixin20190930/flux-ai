// components/AuthForm.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { logWithTimestamp } from "@/utils/logUtils"
import { unifiedAuthManager, LoginCredentials, GoogleCredentials } from '@/utils/unifiedAuthManager'
import { AuthError, AuthErrorCode } from '@/utils/authenticationService'
import { authErrorHandler } from '@/utils/authErrorHandler'

interface AuthFormProps {
    dictionary: any
}

interface GoogleOAuthConfig {
    client_id: string;
    redirect_uri: string;
    scope: string;
    response_type: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
}

interface FormState {
    isSubmitting: boolean;
    showRetry: boolean;
    retryCount: number;
    lastError: AuthError | null;
}

const AuthForm: React.FC<AuthFormProps> = ({dictionary}) => {
    const [isLogin, setIsLogin] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [formState, setFormState] = useState<FormState>({
        isSubmitting: false,
        showRetry: false,
        retryCount: 0,
        lastError: null
    })
    const router = useRouter()
    const params = useParams()
    const currentLocale = params.locale || 'en'

    const googleOAuthConfig: GoogleOAuthConfig = {
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        scope: 'email profile',
        response_type: 'code'
    }

    // Set error handler locale
    useEffect(() => {
        authErrorHandler.setDefaultLocale(currentLocale as string);
    }, [currentLocale]);

    // Form validation
    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        
        // Email validation
        if (!email) {
            errors.email = dictionary.auth.errors.emailRequired || 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = dictionary.auth.errors.emailInvalid || 'Please enter a valid email address';
        }

        // Password validation
        if (!password) {
            errors.password = dictionary.auth.errors.passwordRequired || 'Password is required';
        } else if (password.length < 6) {
            errors.password = dictionary.auth.errors.passwordTooShort || 'Password must be at least 6 characters';
        }

        // Name validation for registration
        if (!isLogin && !name.trim()) {
            errors.name = dictionary.auth.errors.nameRequired || 'Name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Clear form errors when switching between login/register
    useEffect(() => {
        setFormErrors({});
        setFormState(prev => ({ ...prev, lastError: null, showRetry: false }));
    }, [isLogin]);

    // Handle authentication error
    const handleAuthError = (error: AuthError) => {
        setFormState(prev => ({
            ...prev,
            isSubmitting: false,
            lastError: error,
            showRetry: prev.retryCount < 3,
            retryCount: prev.retryCount + 1
        }));

        // Set specific field errors based on error code
        const errors: FormErrors = {};
        
        switch (error.code) {
            case AuthErrorCode.USER_NOT_FOUND:
                errors.email = dictionary.auth.errors.userNotFound || 'No account found with this email';
                break;
            case AuthErrorCode.INVALID_CREDENTIALS:
                errors.password = dictionary.auth.errors.invalidCredentials || 'Invalid password';
                break;
            case AuthErrorCode.EMAIL_ALREADY_EXISTS:
                errors.email = dictionary.auth.errors.emailExists || 'An account with this email already exists';
                break;
            case AuthErrorCode.VALIDATION_ERROR:
                errors.general = dictionary.auth.errors.validationError || 'Please check your input and try again';
                break;
            default:
                errors.general = error.message;
        }

        setFormErrors(errors);
    };

    // Retry last operation
    const handleRetry = () => {
        setFormState(prev => ({ ...prev, showRetry: false, lastError: null }));
        setFormErrors({});
        
        if (formState.lastError?.code === AuthErrorCode.GOOGLE_AUTH_FAILED) {
            handleGoogleLogin();
        } else {
            handleSubmit(new Event('submit') as any);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setFormErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setFormState(prev => ({ ...prev, isSubmitting: true, lastError: null }));

        try {
            if (isLogin) {
                // Login with email and password
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json() as any;

                if (response.ok && data.success) {
                    logWithTimestamp('Login successful:', data.user?.id);
                    
                    // Save user data to localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    logWithTimestamp('user data: ' + JSON.stringify(data.user));
                    console.log('Login successful, user and token saved');

                    // Check for redirect URL
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = `/${currentLocale}/create`;
                    }
                } else {
                    // Handle login error
                    const errorMessage = data.error?.message || dictionary.auth.errors.authFailed;
                    setFormErrors({ general: errorMessage });
                    setFormState(prev => ({ ...prev, isSubmitting: false }));
                }
            } else {
                // Register new user
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json() as any;

                if (response.ok && data.success) {
                    logWithTimestamp('Registration successful:', data.user?.id);
                    
                    // Save user data to localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    console.log('Registration successful, user and token saved');

                    // Redirect to create page
                    window.location.href = `/${currentLocale}/create`;
                } else {
                    // Handle registration error
                    const errorMessage = data.error?.message || dictionary.auth.errors.authFailed;
                    setFormErrors({ general: errorMessage });
                    setFormState(prev => ({ ...prev, isSubmitting: false }));
                }
            }
        } catch (err) {
            logWithTimestamp('Error during authentication:', err);
            setFormErrors({ general: dictionary.auth.errors.unexpected });
            setFormState(prev => ({ ...prev, isSubmitting: false }));
        }
    }

    const handleGoogleLogin = async () => {
        try {
            // 在状态中加入当前语言和CSRF保护
            const state = JSON.stringify({
                locale: currentLocale,
                timestamp: Date.now(),
                origin: window.location.origin,
                nonce: Math.random().toString(36).substring(2, 15)
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
            setFormErrors({ general: dictionary.auth.errors.unexpected });
            logWithTimestamp('Error during Google authentication:', err);
        }
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
                            <p className="text-sm text-red-800">{formErrors.general}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={formState.isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formState.isSubmitting ? 'Processing...' : (isLogin ? dictionary.auth.signInButton : dictionary.auth.registerButton)}
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
