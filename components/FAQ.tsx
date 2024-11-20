import React, {useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import type {Dictionary} from '@/app/i18n/settings'

interface FAQProps {
    dictionary: Dictionary
}

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

// FAQ项目组件
const FAQItem: React.FC<FAQItemProps> = (dictionary, {question, answer, isOpen, onClick}) => (
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

// FAQ主组件
export const FAQ: React.FC<FAQProps> = ({dictionary}) => {
    const [openIndex, setOpenIndex] = useState(0);

    // 从字典中获取FAQ数据
    const faqData = [
        {
            question: dictionary.faq.questions.what.question,
            answer: dictionary.faq.questions.what.answer
        },
        {
            question: dictionary.faq.questions.versions.question,
            answer: dictionary.faq.questions.versions.answer
        },
        {
            question: dictionary.faq.questions.comparison.question,
            answer: dictionary.faq.questions.comparison.answer
        },
        {
            question: dictionary.faq.questions.imageTypes.question,
            answer: dictionary.faq.questions.imageTypes.answer
        },
        {
            question: dictionary.faq.questions.requirements.question,
            answer: dictionary.faq.questions.requirements.answer
        },
        {
            question: dictionary.faq.questions.fineTuning.question,
            answer: dictionary.faq.questions.fineTuning.answer
        },
        {
            question: dictionary.faq.questions.limits.question,
            answer: dictionary.faq.questions.limits.answer
        },
        {
            question: dictionary.faq.questions.updates.question,
            answer: dictionary.faq.questions.updates.answer
        },
        {
            question: dictionary.faq.questions.feedback.question,
            answer: dictionary.faq.questions.feedback.answer
        },
        {
            question: dictionary.faq.questions.commercial.question,
            answer: dictionary.faq.questions.commercial.answer
        }
    ];

    return (
        <section
            className="relative h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container relative mx-auto px-4 z-10">
                <h2 className="text-4xl font-bold text-center mb-4 text-white">
                    {dictionary.faq.title}
                </h2>
                <p className="text-indigo-200 text-center mb-12 max-w-2xl mx-auto">
                    {dictionary.faq.subtitle}
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