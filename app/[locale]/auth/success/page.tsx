'use client'

import {useEffect} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'

export default function AuthSuccess() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const user = searchParams.get('user')

        if (user) {
            try {
                // 解析用户数据
                const userData = JSON.parse(decodeURIComponent(user))
                
                // 存储用户信息到 localStorage
                localStorage.setItem('user', JSON.stringify(userData))
                
                // 触发认证状态更新事件
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('auth-state-changed', {
                        detail: { user: userData, isLoggedIn: true }
                    })
                    window.dispatchEvent(event)
                }
                
                console.log('Auth success - user data stored:', userData)
                
                // 延迟重定向，确保数据已存储
                setTimeout(() => {
                    router.push('/flux-1-1-ultra')
                }, 500)
            } catch (error) {
                console.error('Error parsing user data:', error)
                router.push('/auth?error=invalid_data')
            }
        } else {
            // 如果没有用户信息，重定向到登录页
            router.push('/auth?error=missing_data')
        }
    }, [router, searchParams])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">登录成功</h1>
                <p>正在跳转...</p>
            </div>
        </div>
    )
} 