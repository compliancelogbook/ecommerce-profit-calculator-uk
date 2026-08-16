import type { CategoryFeeRule, SourceRef } from './types';

export const EBAY_SOURCE: SourceRef = {
  url: 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/store-selling-fees?id=4809',
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

/**
 * NON-EXHAUSTIVE. This covers only the categories given in the brief this
 * dataset was built against, each of which is exercised by an acceptance
 * test. eBay UK Business Sellers publish a much larger category schedule
 * (20-30+ entries incl. sub-tiers) — the live page could not be fetched
 * (repeated timeouts, likely JS-rendered/anti-bot) at the time this dataset
 * was built. Do NOT treat this list as the complete official table.
 * Any category not listed here must resolve to UNSUPPORTED_CATEGORY_ID and
 * require explicit manual entry — never a silent fallback to "Everything Else".
 */
export const EBAY_CATEGORIES: CategoryFeeRule[] = [
  {
    id: 'CLOTHES_SHOES_ACCESSORIES',
    label: 'Clothes, Shoes & Accessories',
    schedule: { kind: 'FLAT', rate: 0.119 },
    source: EBAY_SOURCE,
  },
  {
    id: 'WOMENS_BAGS_HANDBAGS',
    label: "Women's Bags & Handbags",
    schedule: { kind: 'TIERED', tiers: [{ upTo: 800, rate: 0.129 }, { upTo: null, rate: 0.07 }] },
    source: EBAY_SOURCE,
  },
  {
    id: 'JEWELLERY_WATCHES',
    label: 'Jewellery & Watches',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.149 }, { upTo: null, rate: 0.04 }] },
    source: EBAY_SOURCE,
  },
  {
    id: 'MOBILE_PHONES',
    label: 'Mobile Phones',
    schedule: { kind: 'FLAT', rate: 0.099 },
    source: EBAY_SOURCE,
  },
  {
    id: 'SMARTPHONES',
    label: 'Smartphones',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.069 }, { upTo: null, rate: 0.03 }] },
    source: EBAY_SOURCE,
  },
  {
    id: 'BUSINESS_OFFICE_INDUSTRIAL',
    label: 'Business, Office & Industrial',
    schedule: { kind: 'FLAT', rate: 0.125 },
    source: EBAY_SOURCE,
  },
  {
    id: 'EVERYTHING_ELSE',
    label: 'Everything Else',
    schedule: { kind: 'FLAT', rate: 0.129 },
    source: EBAY_SOURCE,
  },
];

export const EBAY_PER_ORDER_FEE = {
  threshold: 10, // total sale <= £10
  atOrBelow: 0.3,
  above: 0.4,
};

export const EBAY_REGULATORY_FEE_RATE = 0.0035;

export type EbayInternationalRegion = 'DOMESTIC' | 'EU_NORTHERN_EUROPE' | 'US_CANADA' | 'OTHER';

export const EBAY_INTERNATIONAL_FEE_RATES: Record<EbayInternationalRegion, number> = {
  DOMESTIC: 0,
  EU_NORTHERN_EUROPE: 0.0105,
  US_CANADA: 0.018,
  OTHER: 0.02,
};

export const EBAY_CURRENCY_CONVERSION_RATE = 0.025;

/** Applied only to the variable Final Value Fee component when eligible. */
export const EBAY_TOP_RATED_DISCOUNT_RATE = 0.1;

/** eBay UK Business seller fees are published exclusive of VAT; 20% UK VAT is added on top. */
export const EBAY_FEES_ARE_EX_VAT = true;
