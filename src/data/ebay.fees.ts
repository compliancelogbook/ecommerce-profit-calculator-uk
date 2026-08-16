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
 * 2026-08-16 follow-up audit: eBay's main fee page still could not be
 * directly fetched (repeated timeouts across three separate attempts over
 * two audit passes — the page is JS-rendered/anti-bot protected). However,
 * eBay's community.ebay.co.uk announcement pages ARE directly fetchable,
 * and provided primary-source confirmation of: (a) official category IDs
 * for the three tiered categories, (b) that eBay's own published wording
 * for tiered categories explicitly says "per item" (see JEWELLERY_WATCHES
 * below — this is the direct evidence for the per-item tier fix), and
 * (c) a fully-sourced reduced per-order-fee exception list with category
 * IDs. Where a WebSearch snippet (not a direct fetch) gave numbers that
 * conflicted with this build's tested figures — e.g. an unofficial-looking
 * result quoting Jewellery at 12.9%/£450/2% — that snippet was rejected
 * rather than trusted, per the "never guess" principle.
 */
export const EBAY_SOURCE_AUDIT: SourceRef = {
  ...EBAY_META,
  feeType: 'final_value_fee',
  effectiveDate: null,
  url: 'https://community.ebay.co.uk/t5/Announcements/Final-value-fee-increases-for-business-sellers-in-the-Jewellery/ba-p/7545376',
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
};

/**
 * NON-EXHAUSTIVE, BY DESIGN. This covers only the categories given directly
 * in the original build brief, each of which is exercised by an acceptance
 * test, now enriched with confirmed category IDs and per-item tier basis
 * where evidence was found. eBay UK Business Sellers publish a much larger
 * category schedule; the main fee page remains unfetchable (see
 * EBAY_SOURCE_AUDIT above). Any category not listed here must resolve to
 * UNSUPPORTED_CATEGORY_ID and require explicit manual entry.
 *
 * KNOWN OPEN QUESTION: a primary-source eBay announcement dated 7 March
 * 2024 states the 14.9%/£1,000/4% rate increase applied to "Jewellery
 * only", explicitly noting no corresponding increase for "Watches, Parts &
 * Accessories". This build's original brief and its acceptance tests treat
 * "Jewellery & Watches" as one combined category at that rate — that
 * remains unchanged here because (a) it is the explicit, tested ground
 * truth for this build, and (b) the announcement doesn't state what
 * Watches' current rate actually is, only that it wasn't part of THIS
 * specific increase. Flagged for a human to confirm whether Watches should
 * be split into its own category with its own (currently unknown) rate.
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
    officialCategoryId: '169291',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 800, rate: 0.129 }, { upTo: null, rate: 0.07 }] },
    tierBasis: 'PER_ITEM',
    source: {
      ...EBAY_SOURCE_AUDIT,
      formula: '12.9% on the portion up to £800 per item, 7% on the portion above',
      notes: 'Category ID and per-item basis confirmed 2026-08-16; base rate/threshold unchanged from the original spec-verified figures.',
    },
  },
  {
    id: 'JEWELLERY_WATCHES',
    label: 'Jewellery & Watches',
    officialCategoryId: '281',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.149 }, { upTo: null, rate: 0.04 }] },
    tierBasis: 'PER_ITEM',
    source: {
      ...EBAY_SOURCE_AUDIT,
      formula: '14.9% on the portion up to £1,000 per item, 4% on the portion above',
      notes:
        'Category ID and per-item basis confirmed 2026-08-16 via eBay\'s own announcement text ("14.9% of the total amount of the sale up to £1,000 per item"). See the "known open question" note above re: Watches.',
    },
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
    officialCategoryId: '9355',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.069 }, { upTo: null, rate: 0.03 }] },
    tierBasis: 'PER_ITEM',
    source: {
      ...EBAY_SOURCE_AUDIT,
      formula: '6.9% on the portion up to £1,000 per item, 3% on the portion above',
      notes: 'Category ID and per-item basis confirmed 2026-08-16; base rate/threshold unchanged from the original spec-verified figures.',
    },
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

/**
 * Reduced 10p (instead of 30p) per-order fee for qualifying orders with a
 * total sale price ≤ £10, confirmed via direct fetches of eBay's own
 * community announcement pages during the 2026-08-16 follow-up audit.
 * Sales above £10 are unaffected (revert to the normal 40p).
 *
 * This is exposed as a standalone toggle rather than folded into specific
 * FVF categories because none of these qualifying categories (Antiques,
 * Art, Coins, Collectables, Dolls & Bears, Pottery & Glass, Sports
 * Memorabilia, Stamps, Home/Furniture/DIY) currently have a confirmed
 * variable FVF percentage in this build — adding them as full categories
 * would mean pairing a verified per-order exception with a guessed FVF
 * rate, which is exactly what this build avoids. The user selects their
 * real FVF category (or enters one manually) and separately confirms
 * whether it also qualifies for this reduction.
 */
export const EBAY_REDUCED_PER_ORDER_FEE = 0.1;

export const EBAY_REDUCED_PER_ORDER_FEE_CATEGORIES = [
  { id: '20081', label: 'Antiques' },
  { id: '550', label: 'Art' },
  { id: '11116', label: 'Coins' },
  { id: '1', label: 'Collectables' },
  { id: '237', label: 'Dolls & Bears' },
  { id: '870', label: 'Pottery & Glass' },
  { id: '64482', label: 'Sports Memorabilia' },
  { id: '260', label: 'Stamps' },
  { id: null, label: 'Home, Furniture & DIY' },
] as const;

export const EBAY_REDUCED_PER_ORDER_FEE_SOURCE: SourceRef = {
  ...EBAY_META,
  feeType: 'per_order_fee',
  formula: '£0.10 (instead of £0.30) for a total sale ≤ £10, in qualifying categories only',
  conditions: 'Selected Collectables categories (from 1 Feb 2022) and Home, Furniture & DIY (from 19 Apr 2022), new listings only.',
  effectiveDate: '2022-02-01',
  url: 'https://community.ebay.co.uk/t5/Announcements/10p-per-order-fees-for-sales-up-to-10-in-selected-Collectables/ba-p/7154649',
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Confirmed via two direct community.ebay.co.uk announcement fetches: the Collectables list (with category IDs, effective 1 Feb 2022) and the separate Home, Furniture & DIY announcement (effective 19 Apr 2022, no category ID published).',
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
