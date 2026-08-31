import { describe, expect, it } from 'vitest';
import { allLinesVerifiedAsOf, PLATFORM_VERIFIED_DATE, verifiedBannerFor } from '../verification';
import type { FeeLine } from '../types';
import { calculateShopify } from '../engines/shopify';
import { calculateTikTok } from '../engines/tiktok';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';

const DATE = '2026-08-16';

function makeLine(overrides: Partial<FeeLine>): FeeLine {
  return { id: 'x', label: 'x', amountExVat: 1, category: 'transaction', ...overrides };
}

describe('allLinesVerifiedAsOf', () => {
  it('false when there are no fee lines', () => {
    expect(allLinesVerifiedAsOf([], DATE)).toBe(false);
  });

  it('true when every line is SPEC_VERIFIED as of the date', () => {
    const lines = [
      makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }),
      makeLine({ verificationStatus: 'AUDIT_VERIFIED', verifiedAt: DATE }),
    ];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(true);
  });

  it('false when any single line is AUTOMATED_UNVERIFIED — mixed results never imply blanket verification', () => {
    const lines = [
      makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }),
      makeLine({ verificationStatus: 'AUTOMATED_UNVERIFIED', verifiedAt: null }),
    ];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });

  it('false when any line is a user-entered/manual line with no verification status at all', () => {
    const lines = [makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }), makeLine({})];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });

  it('false when a line was verified on a different date', () => {
    const lines = [makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: '2026-01-01' })];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });
});

describe('PLATFORM_VERIFIED_DATE', () => {
  it('existing marketplaces (Shopify, Etsy, eBay, Amazon) retain 16 August 2026, unchanged', () => {
    expect(PLATFORM_VERIFIED_DATE.SHOPIFY).toEqual({ iso: '2026-08-16', display: '16 August 2026' });
    expect(PLATFORM_VERIFIED_DATE.ETSY).toEqual({ iso: '2026-08-16', display: '16 August 2026' });
    expect(PLATFORM_VERIFIED_DATE.EBAY).toEqual({ iso: '2026-08-16', display: '16 August 2026' });
    expect(PLATFORM_VERIFIED_DATE.AMAZON).toEqual({ iso: '2026-08-16', display: '16 August 2026' });
  });

  it('TikTok Shop has its own, later verification date', () => {
    expect(PLATFORM_VERIFIED_DATE.TIKTOK).toEqual({ iso: '2026-08-31', display: '31 August 2026' });
  });
});

describe('verifiedBannerFor', () => {
  it('returns null for an empty result', () => {
    expect(verifiedBannerFor([])).toBeNull();
  });

  it('returns null when lines carry no platform at all', () => {
    expect(verifiedBannerFor([makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE })])).toBeNull();
  });

  it('a real Shopify result (existing marketplace) shows the unchanged 16 August 2026 banner', () => {
    const r = calculateShopify({
      soldPrice: 30,
      itemCost: 10,
      shippingCharged: 0,
      shippingCost: 0,
      quantity: 1,
      plan: 'BASIC',
      processor: 'SHOPIFY_PAYMENTS',
      cardType: 'STANDARD',
      thirdPartyProcessor: null,
      expectedMonthlyOrders: null,
    });
    expect(verifiedBannerFor(r.feeLines)).toEqual({ display: '16 August 2026' });
  });

  it('a real TikTok result shows its own 31 August 2026 banner, not the existing-marketplace date', () => {
    const r = calculateTikTok({
      soldPrice: 100,
      itemCost: 0,
      customerPaidShipping: 0,
      shippingCost: 0,
      quantity: 1,
      sellerDiscount: 0,
      platformDiscount: 0,
      categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
      otherActualCosts: 0,
    });
    expect(verifiedBannerFor(r.feeLines)).toEqual({ display: '31 August 2026' });
  });

  it('a TikTok result with an unverified/manual line (e.g. a manually entered category rate) shows no banner', () => {
    const r = calculateTikTok({
      soldPrice: 100,
      itemCost: 0,
      customerPaidShipping: 0,
      shippingCost: 0,
      quantity: 1,
      sellerDiscount: 0,
      platformDiscount: 0,
      categoryId: UNSUPPORTED_CATEGORY_ID,
      manualCategoryRate: 0.09,
      otherActualCosts: 0,
    });
    expect(verifiedBannerFor(r.feeLines)).toBeNull();
  });

  it("a TikTok result would NOT be (incorrectly) marked verified against the existing marketplaces' 16 August 2026 date", () => {
    const r = calculateTikTok({
      soldPrice: 100,
      itemCost: 0,
      customerPaidShipping: 0,
      shippingCost: 0,
      quantity: 1,
      sellerDiscount: 0,
      platformDiscount: 0,
      categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
      otherActualCosts: 0,
    });
    expect(allLinesVerifiedAsOf(r.feeLines, '2026-08-16')).toBe(false);
    expect(allLinesVerifiedAsOf(r.feeLines, '2026-08-31')).toBe(true);
  });
});
