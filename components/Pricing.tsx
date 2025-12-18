'use client'

import React, {useState} from 'react';
import {stripePromise} from '@/utils/stripe';
import {logWithTimestamp} from "@/utils/logUtils";
;

interface PricingProps {
    dictionary: any;
    locale: string;
}

interface PricingTierProps {
    tier: {
        name: string;
        price: string;
        features: string[];
        recommended?: string;
    };
    priceId: string;
    purchaseType: 'onetime' | 'monthly' | 'yearly';
    points?: number;
    disabled?: boolean;
    buttonTexts: any['pricing']['tiers']['common'];
}

const PricingTier: React.FC<PricingTierProps> = ({
                                                     tier,
                                                     priceId,
                                                     purchaseType,
                                                     points,
                                                     disabled,
                                                     buttonTexts
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
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({priceId}),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json() as any;
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
            className={`bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col ${tier?.recommended ? 'border-4 border-indigo-500' : ''}`}>
            {tier?.recommended && (
                <div className="bg-indigo-500 text-white text-center py-2 font-semibold">
                    {tier.recommended}
                </div>
            )}
            <div className="px-6 py-8 flex-grow">
                <h3 className="text-2xl font-semibold text-gray-900">{tier?.name || 'Package'}</h3>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">{tier?.price || '$0'}</p>
                <p className="mt-1 text-gray-500">
                    {purchaseType === 'onetime'
                        ? `${points || 0} points`
                        : purchaseType === 'monthly'
                            ? 'per month'
                            : 'per year'}
                </p>
                <ul className="mt-6 space-y-4">
                    {(tier?.features || []).map((feature, index) => (
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
                        ? buttonTexts.processingButton
                        : disabled
                            ? buttonTexts.comingSoonButton
                            : purchaseType === 'onetime'
                                ? buttonTexts.buyNowButton
                                : buttonTexts.subscribeButton}
                </button>
                {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
            </div>
        </div>
    );
};

const Pricing: React.FC<PricingProps> = ({dictionary}) => {
    const pricing = dictionary.pricing;

    return (
        <section id="pricing"
                 className="min-h-screen relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="relative z-10 flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl w-full">
                    <div className="text-center mb-12">
                        <h2 className="text-base font-semibold leading-7 text-indigo-200">
                            {pricing.title}
                        </h2>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            {pricing.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <PricingTier
                            tier={pricing.tiers.basic || { name: 'Basic', price: '$14.9', features: [] }}
                            priceId={process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!}
                            purchaseType="onetime"
                            points={300}
                            buttonTexts={pricing.tiers.common || { buyNowButton: 'Buy Now', processingButton: 'Processing...', comingSoonButton: 'Coming Soon', subscribeButton: 'Subscribe' }}
                        />
                        <PricingTier
                            tier={pricing.tiers.premium || { name: 'Premium', price: '$39.9', features: [] }}
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_MONTH_PRICE_ID!}
                            purchaseType="onetime"
                            points={1000}
                            buttonTexts={pricing.tiers.common}
                        />
                        <PricingTier
                            tier={pricing.tiers.professional || { name: 'Professional', price: '$99.9', features: [] }}
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRO_YEAR_PRICE_ID!}
                            purchaseType="onetime"
                            points={3000}
                            buttonTexts={pricing.tiers.common}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;