'use client'

export const runtime = 'edge'

import {useEffect, useState} from 'react'
import {getany} from '../i18n/utils'
import {useParams} from 'next/navigation'
import {Features} from '@/components/Features'
import {Examples} from '@/components/Examples'
import {UserExperience} from '@/components/UserExperience'
import {FAQ} from '@/components/FAQ'
import {Hero} from "@/components/Hero"
import Pricing from "@/components/Pricing"
import FluxModelsComparison from "@/components/FluxModelsComparison"

export default function Home() {
    const params = useParams()
    const [dictionary, setany] = useState<any | null>(null)
    const [showHeader, setShowHeader] = useState(false)
    const locale = params?.locale as string || 'en'

    useEffect(() => {
        const loadany = async () => {
            const dict = await getany(locale)
            setany(dict)
        }
        loadany()
    }, [locale])

    useEffect(() => {
        const handleScroll = () => {
            setShowHeader(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // 显示加载状态而不是返回null
    if (!dictionary) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                <Hero dictionary={dictionary} locale={locale}/>
                <Features dictionary={dictionary} locale={locale}/>
                <Examples dictionary={dictionary}/>
                <Pricing dictionary={dictionary} locale={locale}/>
                <UserExperience dictionary={dictionary}/>
                <FluxModelsComparison dictionary={dictionary}/>
                <FAQ dictionary={dictionary}/>
            </main>
        </div>
    )
}