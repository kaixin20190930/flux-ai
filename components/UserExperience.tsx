import React from 'react';
import {Camera, Wand2, Sliders, Download} from 'lucide-react';

interface UserExperienceProps {
    dictionary: any
}

export const UserExperience: React.FC<UserExperienceProps> = ({dictionary}) => {
    const steps = [
        {
            ...dictionary.userExperience.steps.describe,
            icon: Camera,
            alt: "Image description process",
            image: "/pictures/userexperience/step1.jpg",
        },
        {
            ...dictionary.userExperience.steps.generate,
            icon: Wand2,
            alt: "AI generation process",
            image: "/pictures/userexperience/step2.jpg",
        },
        {
            ...dictionary.userExperience.steps.refine,
            icon: Sliders,
            alt: "Image refinement process",
            image: "/pictures/userexperience/step3.jpg",
        },
        {
            ...dictionary.userExperience.steps.download,
            icon: Download,
            alt: "Download process",
            image: "/pictures/userexperience/step4.jpg",
        }
    ];

    return (
        <section id="examples"
                 className="relative flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-auto">
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="relative z-10 h-full overflow-hidden">
                <div className="min-h-screen mx-auto flex flex-col px-6 pb-8">
                    <div className="text-center mb-6 pt-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {dictionary.userExperience.title}
                        </h1>
                        <p className="text-lg text-indigo-100 max-w-3xl mx-auto">
                            {dictionary.userExperience.subtitle}
                        </p>
                    </div>

                    <div className="flex-1 flex items-start py-4">
                        <div className="w-full max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/10 border border-white/10"
                                    >
                                        <div className="flex items-start mb-4">
                                            <div
                                                className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full p-3 mr-4">
                                                <step.icon className="w-6 h-6 text-white"/>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>
                                                <p className="text-indigo-300 text-sm">{step.subtitle}</p>
                                            </div>
                                        </div>

                                        <p className="text-indigo-200 text-sm mb-4">{step.description}</p>

                                        <div className="mb-4">
                                            <div
                                                className="bg-black/20 rounded-lg p-2 flex items-center justify-center">
                                                <img
                                                    src={step.image}
                                                    alt={step.alt}
                                                    className="rounded-lg max-w-full max-h-42 w-auto h-auto"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg px-3 py-1.5 inline-block">
                                            <span
                                                className="text-purple-300 text-sm font-medium">{step.highlight}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UserExperience;