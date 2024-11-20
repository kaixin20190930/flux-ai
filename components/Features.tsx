import React from 'react'
import Image from 'next/image'
import type {Dictionary} from '@/app/i18n/settings'

interface FeaturesProps {
    dictionary: Dictionary
    locale: string
}

export const Features: React.FC<FeaturesProps> = ({dictionary, locale}) => {
    const features = [
        {
            ...dictionary.features.cards.advancedAI,
            icon: "/icons/high-quality.svg",
        },
        {
            ...dictionary.features.cards.multipleStyles,
            icon: "/icons/style.svg",
        },
        {
            ...dictionary.features.cards.advancedModel,
            icon: "/icons/tech.svg",
        },
        {
            ...dictionary.features.cards.flexiblePricing,
            icon: "/icons/pricing.svg",
        }
    ]

    return (
        <section id="features" className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"/>
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">
                    {dictionary.features.title}
                </h2>
                <p className="text-xl text-center mb-12 text-indigo-200">
                    {dictionary.features.subtitle}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div key={index}
                             className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10">
                            <div className="flex items-start mb-6">
                                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-4 mr-4">
                                    <Image
                                        src={feature.icon}
                                        alt={feature.title}
                                        width={40}
                                        height={40}
                                        className="text-white"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-white mb-1">{feature.title}</h3>
                                    <p className="text-indigo-300 text-sm">{feature.subtitle}</p>
                                </div>
                            </div>
                            <p className="text-indigo-200 mb-4">{feature.description}</p>
                            <div className="bg-white/5 rounded-lg px-4 py-2 inline-block">
                                <span className="text-purple-300 font-medium">{feature.highlight}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-semibold mb-4 text-white">
                        {dictionary.features.cta.title}
                    </h3>
                    <div className="space-x-4">
                        <a href={`/${locale}/create`}
                           className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-indigo-700 transition duration-300 shadow-lg hover:shadow-xl">
                            {dictionary.features.cta.tryButton}
                        </a>
                        <a href="#pricing"
                           className="inline-block bg-white/10 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition duration-300"
                           onClick={(e) => {
                               e.preventDefault();
                               document.getElementById('pricing')?.scrollIntoView({
                                   behavior: 'smooth'
                               });
                           }}>
                            {dictionary.features.cta.pricingButton}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Features