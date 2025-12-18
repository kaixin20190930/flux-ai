'use client'

import { Locale } from '@/app/i18n/settings'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface AuthSuccessPageProps {
  params: {
    locale: Locale
  }
}

function AuthSuccessContent({ locale }: { locale: Locale }) {
  const router = useRouter()
  
  // With NextAuth, authentication is handled automatically
  // Just redirect to the create page
  useEffect(() => {
    // Small delay to ensure session is established
    const timer = setTimeout(() => {
      router.push(`/${locale}/create`)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [locale, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Authentication Successful
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Redirecting you to the app...
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthSuccessPage({ params }: AuthSuccessPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <AuthSuccessContent locale={params.locale} />
    </Suspense>
  )
}
