'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Star, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { stripePromise } from '@/utils/stripe';
interface NewPricingProps {
  dictionary: any;
  locale: string;
}

interface PricingTierProps {
  tier: {
    name: string;
    price: string;
    points: number;
    features: string[];
    recommended?: string;
  };
  priceId: string;
  isPopular?: boolean;
  dictionary: any;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const PricingTier: React.FC<PricingTierProps> = ({
  tier,
  priceId,
  isPopular,
  dictionary,
  isLoggedIn,
  onLoginRequired
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

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
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const session = await response.json() as { id: string };
      const result = await stripe!.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Purchase error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (index: number) => {
    const icons = [Crown, Zap, Star, Shield, Check];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
  };

  return (
    <div className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 ${
      isPopular ? 'ring-2 ring-yellow-400 scale-105' : ''
    } transition-all duration-300 hover:bg-white/15`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
            {dictionary.pricing?.tiers?.common?.mostPopular || 'Most Popular'}
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-white">{tier.price}</span>
        </div>
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <span className="text-2xl font-semibold text-yellow-400">{tier.points}</span>
          <span className="text-white/80 ml-2">{dictionary.pricing?.tiers?.common?.pointsLabel || 'Points'}</span>
        </div>
        <p className="text-white/70 text-sm">
          {dictionary.pricing?.tiers?.common?.permanentValidity || 'Permanent Validity'}
        </p>
      </div>

      <ul className="space-y-4 mb-8">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            {getIcon(index)}
            <span className="ml-3 text-white/90">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
          isPopular
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600'
            : 'bg-white/20 text-white hover:bg-white/30'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
      >
        {isLoading
          ? dictionary.pricing?.tiers?.common?.processingButton || 'Processing...'
          : !isLoggedIn
          ? dictionary.pricing?.tiers?.common?.loginToBuy || 'Login to Buy'
          : dictionary.pricing?.tiers?.common?.buyNowButton || 'Buy Now'
        }
      </button>

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
};

const PointsUsageGuide: React.FC<{ dictionary: any }> = ({ dictionary }) => {
  const models = dictionary.pricing?.pointsUsage?.models || {};
  
  return (
    <div className="mt-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          {dictionary.pricing?.pointsUsage?.title || 'Points Usage Guide'}
        </h2>
        <p className="text-xl text-white/80">
          {dictionary.pricing?.pointsUsage?.subtitle || 'Points consumed by different features'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(models).map(([key, model]: [string, any]) => (
          <div key={key} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{model.name}</h3>
              <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {model.points} {dictionary.pricing?.tiers?.common?.pointsLabel || 'Points'}
              </span>
            </div>
            <p className="text-white/70">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const NewPricing: React.FC<NewPricingProps> = ({ dictionary, locale }) => {
  const { isAuthenticated } = useAuth();
  const isLoggedIn = isAuthenticated;
  const router = useRouter();

  const handleLoginRequired = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push(`/${locale}/auth`);
  };

  const pricing = dictionary.pricing;
  const tiers = pricing?.tiers || {};

  // 定义价格ID映射（需要在环境变量中配置）
  const priceIds = {
    starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_basic',
    premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    professional: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
  };

  return (
    <section className="min-h-screen relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {pricing?.title || 'Pricing Plans'}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-4">
              {pricing?.subtitle || 'Choose the right points package for you'}
            </p>
            <p className="text-lg text-white/70 mb-8">
              {pricing?.description || 'All features require points to use. Choose a suitable package to start creating'}
            </p>
            {!isLoggedIn && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-yellow-200 font-semibold">
                  {pricing?.loginRequired || 'Login required to use all features'}
                </p>
              </div>
            )}
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-16">
            <PricingTier
              tier={tiers.starter}
              priceId={priceIds.starter}
              dictionary={dictionary}
              isLoggedIn={isLoggedIn}
              onLoginRequired={handleLoginRequired}
            />
            <PricingTier
              tier={tiers.basic}
              priceId={priceIds.basic}
              dictionary={dictionary}
              isLoggedIn={isLoggedIn}
              onLoginRequired={handleLoginRequired}
            />
            <PricingTier
              tier={tiers.premium}
              priceId={priceIds.premium}
              isPopular={true}
              dictionary={dictionary}
              isLoggedIn={isLoggedIn}
              onLoginRequired={handleLoginRequired}
            />
            <PricingTier
              tier={tiers.professional}
              priceId={priceIds.professional}
              dictionary={dictionary}
              isLoggedIn={isLoggedIn}
              onLoginRequired={handleLoginRequired}
            />
            <PricingTier
              tier={tiers.enterprise}
              priceId={priceIds.enterprise}
              dictionary={dictionary}
              isLoggedIn={isLoggedIn}
              onLoginRequired={handleLoginRequired}
            />
          </div>

          {/* Points Usage Guide */}
          <PointsUsageGuide dictionary={dictionary} />
        </div>
      </div>
    </section>
  );
};

export default NewPricing;