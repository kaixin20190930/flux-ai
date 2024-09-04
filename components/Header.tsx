'use client'

import React, {useState, useEffect} from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Header: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 100 && !isVisible) {
                setIsVisible(true)
            } else if (currentScrollY <= 100 && isVisible) {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', handleScroll, {passive: true})

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isVisible
                    ? 'translate-y-0 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-indigo-800/90 backdrop-blur-md py-2'
                    : '-translate-y-full'
            }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/fluxai.svg" alt="Flux AI Logo" width={40} height={40} className="rounded-full"/>
                        <span className="text-xl font-bold text-white">Flux AI</span>
                    </Link>
                    <nav>
                        <ul className="flex space-x-6">
                            <li><Link href="/about"
                                      className="text-indigo-200 hover:text-white transition duration-300">About</Link>
                            </li>
                            <li><Link href="/pricing"
                                      className="text-indigo-200 hover:text-white transition duration-300">Pricing</Link>
                            </li>
                            <li><Link href="/auth"
                                      className="text-indigo-200 hover:text-white transition duration-300">Login</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    )
}

export default Header