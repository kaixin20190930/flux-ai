'use client'

import React, {useState} from 'react';
import {stripePromise} from '@/utils/stripe';
import {logWithTimestamp} from "@/utils/logUtils";

interface PricingTierProps {
    name: string;
    price: string;
    priceId: string;
    features: string[];
    recommended?: boolean;
    purchaseType: 'onetime' | 'monthly' | 'yearly';
    points?: number;
    disabled?: boolean;
}

const PricingTier: React.FC<PricingTierProps> = ({
                                                     name,
                                                     price,
                                                     priceId,
                                                     features,
                                                     recommended,
                                                     purchaseType,
                                                     points,
                                                     disabled
                                                 }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubscribe = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const stripe = await stripePromise;
            const response = await fetch('/api/createCheckoutSession', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({priceId}),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json() as any;

            // Redirect to Stripe Checkout
            const result = await stripe!.redirectToCheckout({
                sessionId: session.id,
            });

            if (result.error) {
                throw new Error(result.error.message as any);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            console.error('Subscription error:', err);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div
            className={`bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col ${recommended ? 'border-4 border-indigo-500' : ''}`}>
            {recommended && (
                <div className="bg-indigo-500 text-white text-center py-2 font-semibold">
                    Recommended
                </div>
            )}
            <div className="px-6 py-8 flex-grow">
                <h3 className="text-2xl font-semibold text-gray-900">{name}</h3>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">{price}</p>
                <p className="mt-1 text-gray-500">
                    {purchaseType === 'onetime'
                        ? `${points} points`
                        : purchaseType === 'monthly'
                            ? 'per month'
                            : 'per year'}
                </p>
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
                <button
                    onClick={handleSubscribe}
                    disabled={isLoading || disabled}
                    className={`block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading
                        ? 'Processing...'
                        : disabled
                            ? 'Coming Soon'
                            : purchaseType === 'onetime'
                                ? 'Buy Now'
                                : 'Subscribe'}
                </button>
                {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
            </div>
        </div>
    );
};

const Pricing: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-800">
            <div className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl w-full">
                    <div className="text-center mb-12">
                        <h2 className="text-base font-semibold leading-7 text-indigo-200">Pricing</h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Choose the right plan for you
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <PricingTier
                            name="Basic"
                            price="$9.9"
                            priceId={process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!}
                            features={[
                                '200 points',
                                'High quality images',
                                'Faster Image generation',
                                'No subscription',
                            ]}
                            purchaseType="onetime"
                            points={200}
                        />
                        <PricingTier
                            name="Premium Plan"
                            price="$29.9"
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID!}
                            features={[
                                '1000 points',
                                'High quality images',
                                'Faster Image generation',
                                'Monthly subscription',
                            ]}
                            recommended
                            purchaseType="monthly"
                            disabled={true}
                        />
                        <PricingTier
                            name="Advanced Plan"
                            price="$99.9"
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID!}
                            features={[
                                '5000 points',
                                'High quality images',
                                'Faster Image generation',
                                'Annual subscription',
                            ]}
                            purchaseType="yearly"
                            disabled={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
