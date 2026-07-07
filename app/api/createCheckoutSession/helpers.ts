import { STRIPE_PACKAGE_POINTS } from '@/config/stripePricing';
import { appendTrackingParams } from '@/utils/trackingSource';

export function normalizeCheckoutSource(
  source?: string,
  entrySource?: string,
  pricingSource?: string,
) {
  return entrySource || pricingSource || source || 'pricing_page';
}

export function resolveStripePackageKey(points?: number) {
  return Object.entries(STRIPE_PACKAGE_POINTS).find(([, mappedPoints]) => mappedPoints === points)?.[0] || null;
}

export function buildCheckoutSessionUrls(
  baseUrl: string,
  locale: string,
  normalizedSource: string,
  entrySource?: string,
  pricingSource?: string,
) {
  const trackingParams = {
    source: normalizedSource,
    entry_source: entrySource || normalizedSource,
    pricing_source: pricingSource || normalizedSource,
  };

  return {
    successUrl: `${baseUrl}` + appendTrackingParams(`/${locale}/success/{CHECKOUT_SESSION_ID}`, trackingParams),
    cancelUrl: `${baseUrl}` + appendTrackingParams(`/${locale}/pricing`, trackingParams),
  };
}

export function buildCheckoutSessionMetadata(params: {
  userId: string;
  points: number;
  packageKey: string | null;
  normalizedSource: string;
  entrySource?: string;
  pricingSource?: string;
}) {
  const { userId, points, packageKey, normalizedSource, entrySource, pricingSource } = params;

  return {
    userId,
    points: String(points),
    packageKey: packageKey || 'unknown',
    product: 'points_package',
    source: normalizedSource,
    entry_source: entrySource || normalizedSource,
    pricing_source: pricingSource || normalizedSource,
  };
}
