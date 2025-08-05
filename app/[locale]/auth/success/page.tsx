'use client'

export const runtime = 'edge'

import { Locale } from '@/app/i18n/settings'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface AuthSuccessPageProps {
  params: {
    locale: Locale
  }
}

function AuthSuccessContent({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'success'
  
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
          <p className="mt-1 text-sm text-gray-500">
            You have been successfully authenticated.
          </p>
          <div className="mt-6">
            <a
              href={`/${locale}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </a>
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AuthSuccessContent locale={params.locale} />
    </Suspense>
  )
}