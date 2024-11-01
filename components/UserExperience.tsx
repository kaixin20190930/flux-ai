import React from 'react'

const steps = [
    {title: "Describe Your Vision", description: "Simply types in a description of the image you want to create."},
    {
        title: "AI Magic at Work",
        description: "Our advanced AI processes your description and generates multiple image options."
    },
    {
        title: "Refine and Perfect",
        description: "Use our intuitive tools to adjust and refine the generated images to your liking."
    },
    {
        title: "Download and Use",
        description: "Once satisfied, download your AI-generated masterpiece in high resolution."
    }
]

export const UserExperience: React.FC = () => {
    return (
        <section className="relative py-20 overflow-hidden">
            {/* 背景 */}
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-900 via-indigo-900 to-purple-800"></div>
            <div className="absolute inset-0 bg-[url('/wave-pattern.svg')] opacity-10"></div>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-12 text-white">How It Works</h2>
                <div className="max-w-3xl mx-auto">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start mb-10">
                            <div
                                className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mr-4">
                                {index + 1}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
                                <p className="text-indigo-200">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}