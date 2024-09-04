import React from 'react';
import Link from 'next/link';

const PricingTier: React.FC<{
    name: string;
    price: string;
    features: string[];
    recommended?: boolean;
}> = ({name, price, features, recommended}) => (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${recommended ? 'border-4 border-indigo-500' : ''}`}>
        {recommended && (
            <div className="bg-indigo-500 text-white text-center py-2 font-semibold">
                Recommended
            </div>
        )}
        <div className="px-6 py-8">
            <h3 className="text-2xl font-semibold text-gray-900">{name}</h3>
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{price}</p>
            <p className="mt-1 text-gray-500">per month</p>
            <ul className="mt-6 space-y-4">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                        <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                ))}
            </ul>
        </div>
        <div className="px-6 py-8 bg-gray-50">
            <Link href="/signup"
                  className="block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700">
                Get started
            </Link>
        </div>
    </div>
);

const Pricing: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-200">Pricing</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Choose the right plan for you
                    </p>
                </div>
                <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <PricingTier
                        name="Basic"
                        price="$9"
                        features={[
                            '100 AI image generations',
                            'Basic image editing tools',
                            'Email support',
                        ]}
                    />
                    <PricingTier
                        name="Pro"
                        price="$29"
                        features={[
                            '500 AI image generations',
                            'Advanced image editing tools',
                            'Priority email support',
                            'API access',
                        ]}
                        recommended
                    />
                    <PricingTier
                        name="Enterprise"
                        price="$99"
                        features={[
                            'Unlimited AI image generations',
                            'Full suite of image editing tools',
                            '24/7 phone and email support',
                            'Custom API solutions',
                            'Dedicated account manager',
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;