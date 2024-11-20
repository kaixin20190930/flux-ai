'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {motion} from 'framer-motion';
import {ArrowRight} from 'lucide-react';
import type {Dictionary} from '@/app/i18n/settings';

interface UltraHeroProps {
    dictionary: Dictionary;
    locale: string;
}

export const UltraHero: React.FC<UltraHeroProps> = ({dictionary, locale}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section
            className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            {/* Hero Content */}
            <div className="relative z-10 container mx-auto px-4 pt-20">
                <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[calc(100vh-80px)]">
                    {/* Left Content */}
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20}}
                        transition={{duration: 0.8}}
                        className="flex-1 text-center lg:text-left"
                    >
                        <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                            <span className="text-purple-300 font-medium">
                                {dictionary.ultraHero.sectionNewRelease}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 block mb-2">
                                {dictionary.ultraHero.heroTitle}
                            </span>
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 block mt-2">
                                {dictionary.ultraHero.heroSubtitle}
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-2xl mx-auto lg:mx-0">
                            {dictionary.ultraHero.heroDescription}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href={`/${locale}/create`}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 group"
                            >
                                {dictionary.ultraHero.heroCallToAction}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                            </Link>
                            <a
                                href="#features"
                                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/20 transition duration-300 flex items-center justify-center gap-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('features')?.scrollIntoView({
                                        behavior: 'smooth'
                                    });
                                }}
                            >
                                {dictionary.ultraHero.heroExploreFeatures}
                            </a>
                        </div>
                    </motion.div>

                    {/* Right Content - Image Showcase */}
                    <motion.div
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20}}
                        transition={{duration: 0.8, delay: 0.2}}
                        className="flex-1 relative"
                    >
                        <div className="relative w-full max-w-xl mx-auto">
                            <div className="relative z-20 rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="/pictures/ultra/showcase.jpg"
                                    alt={dictionary.ultraHero.imageAlt}
                                    width={800}
                                    height={800}
                                    className="w-full h-auto"
                                />
                            </div>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-3xl -z-10 transform scale-95"/>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default UltraHero;