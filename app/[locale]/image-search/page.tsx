'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {getany} from '../../i18n/utils'
import { ImageSearch } from '@/components/image-search/ImageSearch'

export default function ImageSearchPage() {
  const params = useParams()
  const [dictionary, setany] = useState<any | null>(null)
  const locale = params?.locale as string || 'en'

  useEffect(() => {
    const loadany = async () => {
      const dict = await getany(locale)
      setany(dict)
    }
    loadany()
  }, [locale])

  // 显示加载状态而不是返回null
  if (!dictionary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading Image Search...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <ImageSearch dictionary={dictionary} locale={locale} />
      </main>
    </div>
  )
}