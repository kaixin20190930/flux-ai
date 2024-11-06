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
        question: "What is Flux AI Model?",
        answer: "Flux AI is a state-of-the-art artificial intelligence model designed to assist with creative tasks, image generation, and design workflows. It uses advanced machine learning algorithms to understand and generate visual content based on user input."
    },
    {
        question: "What are the different versions of FLUX AI?",
        answer: "FLUX AI comes in three variants: FLUX.1 [pro] for top performance, FLUX.1 [dev] for non-commercial applications, and FLUX.1 [schnell] for fast, local development."
    },
    {
        question: "How does Flux AI compare to other AI models?",
        answer: "Flux AI distinguishes itself through superior image quality, faster generation times, and more intuitive controls. Our model has been specifically trained on high-quality creative content, making it particularly effective for design and artistic applications."
    },
    {
        question: "What types of images can Flux AI generate?",
        answer: "Flux AI can generate a wide range of visual content including illustrations, concept art, product designs, character designs, and environmental scenes. The model supports various artistic styles and can adapt to specific visual requirements."
    },
    {
        question: "What are the technical requirements to use Flux AI?",
        answer: "Flux AI runs in the cloud and can be accessed through any modern web browser. No special hardware is required, though a stable internet connection is recommended for optimal performance."
    },
    {
        question: "Can I fine-tune the FLUX AI Image Generator on my own dataset?",
        answer: "Fine-tuning options may be available for enterprise clients. Please contact Black Forest Labs directly to discuss your specific needs."
    },
    {
        question: "Is there a limit to how many images I can generate?",
        answer: "Usage limits depend on your subscription tier. Free users can generate up to 3 images per day, while premium users enjoy unlimited generations and priority processing."
    },
    {
        question: "How often is the FLUX AI Image Generator updated?",
        answer: "Black Forest Labs is committed to continual improvement. While specific update schedules are not provided, you can expect regular enhancements and refinements to FLUX AI."
    },
    {
        question: "How can I provide feedback or report issues with FLUX AI?",
        answer: "Black Forest Labs welcomes feedback. You can reach out via their official channels or email flux@blackforestlabs.ai for support and to report any issues."
    },
    {
        question: "Can I use FLUX AI Image Generator for commercial projects?",
        answer: "While FLUX.1 [schnell] is free for personal use, we offer FLUX.1 [pro] and FLUX.1 [dev] for commercial applications of Flux AI Image Generator. These versions provide enhanced capabilities and are available through our API or partners. For commercial use inquiries of FLUX AI Image Generator, please contact us at juq1991@gmail.com."
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

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section
            className="relative h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">Frequently Asked Questions</h2>
                <p className="text-indigo-200 text-center mb-12 max-w-2xl mx-auto">
                    Get answers to common questions about Flux AI and how it can enhance your creative workflow
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

export default FAQ;