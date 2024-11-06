'use client'

import {useEffect, useState} from 'react'
import {Features} from '@/components/Features'
import {Examples} from '@/components/Examples'
import {UserExperience} from '@/components/UserExperience'
import {FAQ} from '@/components/FAQ'
import Footer from '../components/Footer'
import {Hero} from "@/components/Hero";
import Pricing from "@/components/Pricing";
import FluxModelsComparison from "@/components/FluxModelsComparison";


export default function Home() {
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
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                <Hero/>
                <Features/>
                <Examples/>
                <Pricing/>
                <UserExperience/>
                <FluxModelsComparison/>
                <FAQ/>
            </main>
        </div>
    )
}