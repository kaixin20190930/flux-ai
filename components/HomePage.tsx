// components/HomePage.tsx
'use client'

import {useEffect, useState} from 'react'
import {Features} from '@/components/Features'
import {Examples} from '@/components/Examples'
import {UserExperience} from '@/components/UserExperience'
import {FAQ} from '@/components/FAQ'
import {Hero} from "@/components/Hero"
import Pricing from "@/components/Pricing"
import FluxModelsComparison from "@/components/FluxModelsComparison"
interface HomePageProps {
    dictionary: any
    locale: string;
}

export function HomePage({dictionary, locale}: HomePageProps) {
    const [showHeader, setShowHeader] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY
            setShowHeader(scrollPosition > 50)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <>
            <Hero dictionary={dictionary} locale={locale}/>
            <Features dictionary={dictionary} locale={locale}/>
            <Examples dictionary={dictionary}/>
            <Pricing dictionary={dictionary} locale={locale}/>
            <UserExperience dictionary={dictionary}/>
            <FluxModelsComparison dictionary={dictionary}/>
            <FAQ dictionary={dictionary}/>
        </>
    )
}