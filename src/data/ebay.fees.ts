import type { CategoryFeeRule, SourceRef } from './types';

const EBAY_META = { platform: 'EBAY', sellerMarket: 'GB', currency: 'GBP' } as const;

export const EBAY_SOURCE: SourceRef = {
  ...EBAY_META,
  feeType: 'final_value_fee',
  effectiveDate: null,
  url: 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/store-selling-fees?id=4809',
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

/**
 * NON-EXHAUSTIVE, BY DESIGN. This covers only the categories given directly
 * in the original build brief, each of which is exercised by an acceptance
 * test. eBay UK Business Sellers publish a much larger category schedule
 * (20-30+ entries incl. sub-tiers).
 *
 * During the 2026-08-16 launch audit, three further attempts were made to
 * expand this table from eBay's live page: two direct fetches (both timed
 * out — the page is JS-rendered/anti-bot protected) and one targeted web
 * search restricted to ebay.co.uk. The search returned a snippet quoting
 * DIFFERENT figures for Jewellery (12.9% up to £450 / 2% above) than the
 * figures given in the original brief and confirmed by this build's
 * acceptance tests (14.9% up to £1,000 / 4% above) — a direct conflict with
 * no way to adjudicate which is current without page access, and eBay's own
 * rate cards are known to change periodically. Given that unreliability,
 * expanding this table further was deliberately NOT done rather than risk
 * encoding a wrong or stale rate under the banner of "verified". Any
 * category not listed here must resolve to UNSUPPORTED_CATEGORY_ID and
 * require explicit manual entry — never a silent fallback to "Everything Else".
 */
export const EBAY_CATEGORIES: CategoryFeeRule[] = [
  {
    id: 'CLOTHES_SHOES_ACCESSORIES',
    label: 'Clothes, Shoes & Accessories',
    schedule: { kind: 'FLAT', rate: 0.119 },
    source: { ...EBAY_SOURCE, formula: '11.9% flat' },
  },
  {
    id: 'WOMENS_BAGS_HANDBAGS',
    label: "Women's Bags & Handbags",
    schedule: { kind: 'TIERED', tiers: [{ upTo: 800, rate: 0.129 }, { upTo: null, rate: 0.07 }] },
    source: { ...EBAY_SOURCE, formula: '12.9% on the portion up to £800, 7% on the portion above' },
  },
  {
    id: 'JEWELLERY_WATCHES',
    label: 'Jewellery & Watches',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.149 }, { upTo: null, rate: 0.04 }] },
    source: { ...EBAY_SOURCE, formula: '14.9% on the portion up to £1,000, 4% on the portion above' },
  },
  {
    id: 'MOBILE_PHONES',
    label: 'Mobile Phones',
    schedule: { kind: 'FLAT', rate: 0.099 },
    source: { ...EBAY_SOURCE, formula: '9.9% flat' },
  },
  {
    id: 'SMARTPHONES',
    label: 'Smartphones',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.069 }, { upTo: null, rate: 0.03 }] },
    source: { ...EBAY_SOURCE, formula: '6.9% on the portion up to £1,000, 3% on the portion above' },
  },
  {
    id: 'BUSINESS_OFFICE_INDUSTRIAL',
    label: 'Business, Office & Industrial',
    schedule: { kind: 'FLAT', rate: 0.125 },
    source: { ...EBAY_SOURCE, formula: '12.5% flat' },
  },
  {
    id: 'EVERYTHING_ELSE',
    label: 'Everything Else',
    schedule: { kind: 'FLAT', rate: 0.129 },
    source: { ...EBAY_SOURCE, formula: '12.9% flat' },
  },
];

export const EBAY_PER_ORDER_FEE = {
  threshold: 10, // total sale <= £10
  atOrBelow: 0.3,
  above: 0.4,
};

export const EBAY_PER_ORDER_FEE_SOURCE: SourceRef = {
  ...EBAY_SOURCE,
  feeType: 'per_order_fee',
  formula: '£0.30 for a total sale ≤ £10, £0.40 for a total sale > £10',
};

export const EBAY_REGULATORY_FEE_RATE = 0.0035;

export const EBAY_REGULATORY_FEE_SOURCE: SourceRef = {
  ...EBAY_SOURCE,
  feeType: 'regulatory_operating_fee',
  formula: '0.35% of the total-sale basis',
};

export type EbayInternationalRegion = 'DOMESTIC' | 'EU_NORTHERN_EUROPE' | 'US_CANADA' | 'OTHER';

export const EBAY_INTERNATIONAL_FEE_RATES: Record<EbayInternationalRegion, number> = {
  DOMESTIC: 0,
  EU_NORTHERN_EUROPE: 0.0105,
  US_CANADA: 0.018,
  OTHER: 0.02,
};

export const EBAY_INTERNATIONAL_FEE_SOURCE: SourceRef = {
  ...EBAY_SOURCE,
  feeType: 'international_fee',
  formula: 'Domestic 0%, Eurozone/Northern Europe 1.05%, US/Canada 1.8%, Other 2.0%',
};

export const EBAY_CURRENCY_CONVERSION_RATE = 0.025;

export const EBAY_CURRENCY_CONVERSION_SOURCE: SourceRef = {
  ...EBAY_SOURCE,
  feeType: 'currency_conversion_fee',
  formula: '2.5% of the relevant basis',
  conditions: 'Applies only when eBay performs currency conversion on the order.',
};

/** Applied only to the variable Final Value Fee component when eligible. */
export const EBAY_TOP_RATED_DISCOUNT_RATE = 0.1;

export const EBAY_TOP_RATED_SOURCE: SourceRef = {
  ...EBAY_SOURCE,
  feeType: 'discount',
  formula: '10% reduction applied only to the variable Final Value Fee component',
  conditions: 'Requires Top Rated Premium Service eligibility.',
};

/** eBay UK Business seller fees are published exclusive of VAT; 20% UK VAT is added on top. */
export const EBAY_FEES_ARE_EX_VAT = true;
