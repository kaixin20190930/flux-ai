'use client'

import {useEffect, useState} from 'react'
import {Metadata} from 'next'
import Header from '../components/Header'
import {AIImageGenerator} from '../components/AIImageGenerator'
import {CoreTechAdvantages} from '../components/CoreTechAdvantages'
import {UniqueUseCases} from '../components/UniqueUseCases'
import {UserExperience} from '../components/UserExperience'
import {CustomerSuccess} from '../components/CustomerSuccess'
import Footer from '../components/Footer'
import {Hero} from "@/components/Hero";


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
                <CoreTechAdvantages/>
                <UniqueUseCases/>
                <UserExperience/>
                <CustomerSuccess/>
            </main>
        </div>
    )
}