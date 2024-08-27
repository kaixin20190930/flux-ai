import React from 'react'
import Image from 'next/image'

const useCases = [
    {
        title: "Concept Art Generation",
        description: "Rapidly prototype visual ideas for games, films, and other creative projects.",
        imageSrc: "/images/concept-art.jpg"
    },
    {
        title: "Custom Illustration Creation",
        description: "Generate unique illustrations for books, articles, or marketing materials.",
        imageSrc: "/images/custom-illustration.jpg"
    },
    {
        title: "Product Design Visualization",
        description: "Bring product ideas to life with AI-generated visual representations.",
        imageSrc: "/images/product-design.jpg"
    }
]

export const UniqueUseCases: React.FC = () => {
    return (
        <section className="relative py-20 overflow-hidden">
            {/* 背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900"></div>
            <div className="absolute inset-0 bg-[url('/subtle-pattern.png')] opacity-5"></div>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-8 text-white">Unique Use Cases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {useCases.map((useCase, index) => (
                        <div key={index}
                             className="bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105">
                            <Image src={useCase.imageSrc} alt={useCase.title} width={400} height={300}
                                   className="w-full h-48 object-cover"/>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2 text-white">{useCase.title}</h3>
                                <p className="text-indigo-200">{useCase.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}