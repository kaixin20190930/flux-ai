'use client'

import {useEffect, useState} from 'react'
import {getDictionary} from '../i18n/utils'
import {useParams} from 'next/navigation'
import {Features} from '@/components/Features'
import {Examples} from '@/components/Examples'
import {UserExperience} from '@/components/UserExperience'
import {FAQ} from '@/components/FAQ'
import {Hero} from "@/components/Hero"
import Pricing from "@/components/Pricing"
import FluxModelsComparison from "@/components/FluxModelsComparison"
import type {Dictionary} from '../i18n/settings'

export default function Home() {
    const params = useParams()
    const [dictionary, setDictionary] = useState<Dictionary | null>(null)
    const [showHeader, setShowHeader] = useState(false)
    const locale = params?.locale as string || 'en'

    useEffect(() => {
        const loadDictionary = async () => {
            const dict = await getDictionary(locale)
            setDictionary(dict)
        }
        loadDictionary()
    }, [locale])

    useEffect(() => {
        const handleScroll = () => {
            setShowHeader(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (!dictionary) return null

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