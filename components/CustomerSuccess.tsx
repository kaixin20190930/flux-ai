import React from 'react'
import Image from 'next/image'

const testimonials = [
    {
        name: "Sarah J.",
        role: "Graphic Designer",
        quote: "Flux AI has revolutionized my workflow. I can now generate initial concepts in minutes instead of hours.",
        avatarSrc: "/images/sarah-avatar.jpg"
    },
    {
        name: "Mark T.",
        role: "Game Developer",
        quote: "The quality and speed of Flux AI's image generation have significantly improved our game design process.",
        avatarSrc: "/images/mark-avatar.jpg"
    }
]

export const CustomerSuccess: React.FC = () => {
    return (
        <section className="relative py-20 overflow-hidden">
            {/* 背景 */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800"></div>
            <div className="absolute inset-0 bg-[url('/dots-pattern.svg')] opacity-5"></div>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-12 text-white">What Our Users Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index}
                             className="bg-white/10 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <p className="text-indigo-200 mb-4 italic">{testimonial.quote}</p>
                            <div className="flex items-center">
                                <Image src={testimonial.avatarSrc} alt={testimonial.name} width={50} height={50}
                                       className="rounded-full mr-4"/>
                                <div>
                                    <p className="font-semibold text-white">{testimonial.name}</p>
                                    <p className="text-sm text-indigo-300">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}