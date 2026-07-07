import { STRIPE_PACKAGE_POINTS, buildPriceIdToPointsMap } from '../stripePricing';

describe('stripePricing', () => {
  it('maps configured Stripe price ids to the expected point values', () => {
    const map = buildPriceIdToPointsMap({
      NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: 'price_starter',
      NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID: 'price_basic',
      NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: 'price_premium',
      NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID: 'price_professional',
      NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: 'price_enterprise',
    });

    expect(map).toEqual({
      price_starter: STRIPE_PACKAGE_POINTS.starter,
      price_basic: STRIPE_PACKAGE_POINTS.basic,
      price_premium: STRIPE_PACKAGE_POINTS.premium,
      price_professional: STRIPE_PACKAGE_POINTS.professional,
      price_enterprise: STRIPE_PACKAGE_POINTS.enterprise,
    });
  });

  it('ignores missing or malformed price ids', () => {
    const map = buildPriceIdToPointsMap({
      NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: '',
      NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID: 'not-a-price-id',
      NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: 'price_premium',
    });

    expect(map).toEqual({
      price_premium: STRIPE_PACKAGE_POINTS.premium,
    });
  });
});
