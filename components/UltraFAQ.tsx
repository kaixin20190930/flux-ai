import React, {useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';

interface FAQData {
    question: string;
    answer: string;
}

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const faqData: FAQData[] = [
    {
        question: "What is Flux 1.1 Pro Ultra?",
        answer: "Flux 1.1 Pro Ultra is an advanced AI image generator model that can create highly realistic images up to 4 megapixels in resolution. It offers both ultra and raw modes for maximum flexibility in image generation."
    },
    {
        question: "How can I try Flux 1.1 Pro Ultra?",
        answer: "You can try Flux 1.1 Pro Ultra for free by login your account. New users get one 3 points(1 time) to experience the enhanced capabilities of this advanced model."
    },
    {
        question: "What are the key features of Flux 1.1 Pro Ultra?",
        answer: "The key features include the ability to generate images up to 4 megapixels in size, a raw mode optimized for photorealistic outputs, and enhanced natural image generation capabilities compared to previous models."
    },
    {
        question: "What is the difference between ultra and raw modes?",
        answer: "While both modes can generate high-quality images, the raw mode is specifically optimized for creating highly realistic and natural-looking images. Ultra mode offers more general-purpose image generation capabilities."
    },
    {
        question: "What makes Flux 1.1 Pro Ultra different from other models?",
        answer: "Flux 1.1 Pro Ultra stands out with its ability to generate larger 4 megapixel images, enhanced realism particularly in raw mode, and improved natural image generation compared to previous versions."
    }
];

const FAQItem: React.FC<FAQItemProps> = ({question, answer, isOpen, onClick}) => (
    <div className="border-b border-white/10 last:border-none">
        <button
            className="w-full py-4 px-6 flex justify-between items-center text-left focus:outline-none"
            onClick={onClick}
        >
            <span className="text-white font-medium">{question}</span>
            {isOpen ? (
                <ChevronUp className="w-5 h-5 text-indigo-300"/>
            ) : (
                <ChevronDown className="w-5 h-5 text-indigo-300"/>
            )}
        </button>
        {isOpen && (
            <div className="px-6 pb-4">
                <p className="text-indigo-200">{answer}</p>
            </div>
        )}
    </div>
);

export const UltraFAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section
            className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Frequently Asked Questions</h2>
                <p className="text-indigo-200 text-center mb-12 max-w-2xl mx-auto">
                    Get answers to common questions about Flux 1.1 Ultra and how it can enhance your creative workflow
                </p>

                <div
                    className="max-w-3xl mx-auto bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                    {faqData.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={index === openIndex}
                            onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UltraFAQ;