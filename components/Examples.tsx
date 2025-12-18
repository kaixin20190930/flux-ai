'use client'
import React, {useEffect, useState} from 'react'
import Image from 'next/image'

interface ExamplesProps {
    dictionary: any
}

const examples = [
    {
        prompt: "Artistic interpretation of the human consciousness and subconsciousness\n",
        image: "/pictures/examples/example.jpg",
        style: "Artistic Interpretation"
    }, {
        prompt: "Write this poem with cursive text on a background that fits the words:\nRoses are red\n  Violets are blue,\nSugar is sweet\n  And so are you",
        image: "/pictures/examples/example1.jpg",
        style: "Love Poem"
    },
    {
        prompt: "The world's largest black forest cake, the size of a building, surrounded by trees of the black forest\n",
        image: "/pictures/examples/example2.jpg",
        style: "largest black forest cake"
    },
    {
        prompt: "Portrait of a woman in Renaissance painting style",
        image: "/pictures/examples/example3.jpg",
        style: "Renaissance"
    },
    {
        prompt: "Futuristic spaceship interior, sci-fi concept art",
        image: "/pictures/examples/example4.jpg",
        style: "Sci-fi"
    },
    {
        prompt: "Japanese anime style character in a garden",
        image: "/pictures/examples/example5.jpg",
        style: "Anime"
    },
    {
        prompt: "Abstract geometric patterns in vibrant colors",
        image: "/pictures/examples/example6.jpg",
        style: "Abstract"
    },
    {
        prompt: "Create a captivating portrait of a voluptuous boho woman with green eyes and long, wavy blonde hair, she is standing. She has a fair complexion adorned with delicate freckles, and her expression is contemplative, reflecting a moment of deep thought. She wears a white-colored, off-shoulder linen satin dress, with deep neck linen, complemented by a necklace and various boho jewelry that accentuates her bohemian style., photo, poster, vibrant, portrait photography, fashion",
        image: "/pictures/examples/example7.jpg",
        style: "portrait"
    },
    {
        prompt: "pareidolic anamorphosis of a hole in a brick wall morphed into a hublot of a sail boat, a window to the sea.",
        image: "/pictures/examples/example8.jpg",
        style: "surreal"
    },
    {
        prompt: "A serene Japanese garden with cherry blossoms, a small wooden bridge over a koi pond, soft morning light filtering through the trees",
        image: "/pictures/examples/example9.jpg",
        style: "Photorealistic"
    },
    {
        prompt: "Cyberpunk street market in night rain, neon signs reflecting in puddles, floating holographic advertisements, street vendors with futuristic food stalls",
        image: "/pictures/examples/example10.jpg",
        style: "Cyberpunk Digital Art"
    },
    {
        prompt: "Whimsical treehouse library in autumn, books floating between branches, magical glowing lanterns, tiny staircases wrapping around tree trunks",
        image: "/pictures/examples/example11.jpg",
        style: "Fantasy Illustration"
    },
    {
        prompt: "Modern minimalist interior design, large windows with ocean view, clean lines, natural materials, subtle morning light casting shadows",
        image: "/pictures/examples/example12.jpg",
        style: "Architectural Visualization"
    },
    {
        prompt: "Young witch brewing potions in a cozy cottage, magical ingredients floating in the air, curious cat familiar, warm candlelight, detailed in Studio Ghibli style",
        image: "/pictures/examples/example13.jpg",
        style: "Anime/Ghibli"
    },
    {
        prompt: "Ethereal portrait of a woman with constellation freckles, flowing hair made of galaxy patterns, cosmic elements, purple and blue color scheme",
        image: "/pictures/examples/example14.jpg",
        style: "Fantasy Portrait"
    },
    {
        prompt: "Steampunk flying ship breaking through clouds at sunset, brass and copper details, steam trailing behind, Victorian-era design elements",
        image: "/pictures/examples/example15.jpg",
        style: "Steampunk Concept Art"
    },
    {
        prompt: "Underwater city in bioluminescent deep sea, jellyfish floating between buildings, coral architecture, schools of colorful fish",
        image: "/pictures/examples/example16.jpg",
        style: "Sci-fi Environment"
    },
    {
        prompt: "Mystical ancient library with floating books, spiral staircases reaching into shadows, dust motes catching magical light, intricate architectural details",
        image: "/pictures/examples/example17.jpg",
        style: "Gothic Fantasy"
    },
    {
        prompt: "Retro-futuristic space station lounge, 1970s style furniture, large viewing windows showing Earth, astronauts relaxing in vintage space suits",
        image: "/pictures/examples/example18.jpg",
        style: "Retro Sci-fi"
    },
    {
        prompt: "Abstract representation of music, flowing color waves, geometric patterns, dynamic movement, vibrant complementary colors",
        image: "/pictures/examples/example19.jpg",
        style: "Abstract Art"
    },
    {
        prompt: "Renaissance-style portrait of a robot noble, ornate metallic clothing, oil painting texture, dramatic lighting, detailed mechanical features",
        image: "/pictures/examples/example20.jpg",
        style: "Classical Fusion"
    }

]

export const Examples: React.FC<ExamplesProps> = ({dictionary}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % examples.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(examples[activeIndex].prompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <section id="examples"
                 className="relative py-20 overflow-hidden inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">
                    {dictionary.examples.title}
                </h2>
                <p className="text-xl text-center mb-12 text-indigo-200">
                    {dictionary.examples.subtitle}
                </p>

                <div className="relative max-w-6xl mx-auto">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-black/20 z-10"></div>
                        <Image
                            src={examples[activeIndex].image}
                            alt={examples[activeIndex].prompt}
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                            <div
                                className="inline-block px-3 py-1 bg-purple-500/80 rounded-full text-sm text-white mb-2">
                                {examples[activeIndex].style}
                            </div>
                            <p className="text-white text-lg font-medium">
                                {examples[activeIndex].prompt}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6 overflow-x-auto pb-4 snap-x">
                        {examples.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition-all duration-300 
                                    ${activeIndex === index ? 'ring-2 ring-purple-500 scale-105' : 'opacity-70'}`}
                            >
                                <Image
                                    src={example.image}
                                    alt={example.prompt}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>

                    {/* 控制按钮 */}
                    <button
                        onClick={() => setActiveIndex((current) => (current - 1 + examples.length) % examples.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition z-30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                        </svg>
                    </button>
                    <button
                        onClick={() => setActiveIndex((current) => (current + 1) % examples.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition z-30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Examples