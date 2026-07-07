import {
  buildCheckoutSessionMetadata,
  buildCheckoutSessionUrls,
  normalizeCheckoutSource,
  resolveStripePackageKey,
} from '../helpers';

describe('createCheckoutSession helpers', () => {
  it('normalizes tracking source with the expected priority', () => {
    expect(normalizeCheckoutSource('pricing_page', 'entry_page', 'pricing_source')).toBe('entry_page');
    expect(normalizeCheckoutSource('pricing_page', undefined, 'pricing_source')).toBe('pricing_source');
    expect(normalizeCheckoutSource('pricing_page', undefined, undefined)).toBe('pricing_page');
  });

  it('resolves package keys from the configured point tiers', () => {
    expect(resolveStripePackageKey(100)).toBe('starter');
    expect(resolveStripePackageKey(300)).toBe('basic');
    expect(resolveStripePackageKey(1000)).toBe('premium');
    expect(resolveStripePackageKey(3000)).toBe('professional');
    expect(resolveStripePackageKey(10000)).toBe('enterprise');
    expect(resolveStripePackageKey(42)).toBeNull();
  });

  it('builds tracked success and cancel URLs plus metadata', () => {
    const urls = buildCheckoutSessionUrls(
      'https://flux-ai-img.com',
      'en',
      'pricing_success_page',
      'entry_page',
      'pricing_page',
    );

    expect(urls.successUrl).toContain('https://flux-ai-img.com/en/success/{CHECKOUT_SESSION_ID}');
    expect(urls.successUrl).toContain('source=pricing_success_page');
    expect(urls.successUrl).toContain('entry_source=entry_page');
    expect(urls.successUrl).toContain('pricing_source=pricing_page');
    expect(urls.cancelUrl).toContain('https://flux-ai-img.com/en/pricing');

    expect(buildCheckoutSessionMetadata({
      userId: 'user-123',
      points: 300,
      packageKey: 'basic',
      normalizedSource: 'pricing_success_page',
      entrySource: 'entry_page',
      pricingSource: 'pricing_page',
    })).toEqual({
      userId: 'user-123',
      points: '300',
      packageKey: 'basic',
      product: 'points_package',
      source: 'pricing_success_page',
      entry_source: 'entry_page',
      pricing_source: 'pricing_page',
    });
  });
});
