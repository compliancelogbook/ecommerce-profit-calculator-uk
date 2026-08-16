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
 * 2026-08-16 second follow-up audit: the auditor supplied the Jewellery
 * (#281, excluding subcategories) vs Watches, Parts & Accessories (#260324)
 * split with exact figures, resolving the "known open question" flagged in
 * the prior pass. Independently corroborated: a WebSearch for "260324"
 * returned eBay's own category browse page at
 * ebay.co.uk/b/Watches-Parts-Accessories/260324/..., confirming that ID
 * really is "Watches, Parts & Accessories" (not merely asserted).
 *
 * The main consolidated fee page (the only source with the FULL category
 * table) remained unfetchable this round too — 4 further direct-fetch
 * attempts (the main page under two URL slugs, a generic "selling-fees"
 * page, and a fees.ebay.co.uk subdomain that doesn't resolve at all) all
 * failed, plus 2 more community-forum threads that exist but sit behind a
 * login wall. Only eBay's public (non-login-walled) community announcement
 * pages remain directly fetchable, and by their nature those only document
 * specific historical fee changes, not the current consolidated table.
 * Expanding coverage beyond what's below was NOT attempted by guessing.
 */
export const EBAY_SOURCE_AUDIT: SourceRef = {
  ...EBAY_META,
  feeType: 'final_value_fee',
  effectiveDate: null,
  url: EBAY_SOURCE.url,
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
};

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
 * community announcement pages. Sales above £10 are unaffected (revert to
 * the normal 40p).
 *
 * 2026-08-16 second follow-up audit: eligibility is now derived ENTIRELY
 * from `CategoryFeeRule.reducedPerOrderFee` on the selected category — the
 * previous standalone "qualifies for reduced fee" checkbox was removed
 * because it let a user assert eligibility independent of category (e.g.
 * applying the discount to Jewellery), which is never correct. A manual/
 * unsupported category can never receive this reduction, because
 * eligibility cannot be established for an arbitrary manual entry.
 */
export const EBAY_REDUCED_PER_ORDER_FEE = 0.1;

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

/**
 * NON-EXHAUSTIVE, BY DESIGN — see EBAY_SOURCE_AUDIT above for why. Covers:
 * (a) the categories given directly in the original build brief, exercised
 * by acceptance tests, now split so Jewellery and Watches are no longer
 * incorrectly combined; and (b) categories where at least the reduced
 * per-order fee eligibility is confirmed even though the variable FVF rate
 * is not (`schedule` omitted — see CategoryFeeRule). Any category not
 * listed here must resolve to UNSUPPORTED_CATEGORY_ID and require explicit
 * manual entry — never a silent fallback to "Everything Else", and never an
 * assumed reduced per-order fee.
 */
export const EBAY_CATEGORIES: CategoryFeeRule[] = [
  // --- Categories with a confirmed variable Final Value Fee ---
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
    id: 'JEWELLERY',
    label: 'Jewellery',
    officialCategoryId: '281',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 1000, rate: 0.149 }, { upTo: null, rate: 0.04 }] },
    tierBasis: 'PER_ITEM',
    source: {
      ...EBAY_SOURCE_AUDIT,
      formula: '14.9% on the portion up to £1,000 per item, 4% on the portion above',
      notes:
        'Parent category #281, EXCLUDING its published subcategories (see Watches, Parts & Accessories below, split out 2026-08-16). Confirmed via eBay\'s own announcement text ("14.9% of the total amount of the sale up to £1,000 per item").',
    },
  },
  {
    id: 'WATCHES_PARTS_ACCESSORIES',
    label: 'Watches, Parts & Accessories',
    officialCategoryId: '260324',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 750, rate: 0.129 }, { upTo: null, rate: 0.03 }] },
    tierBasis: 'PER_ITEM',
    source: {
      ...EBAY_SOURCE_AUDIT,
      formula: '12.9% on the portion up to £750 per item, 3% on the portion above',
      notes:
        'Split out from "Jewellery & Watches" 2026-08-16 — this subcategory does NOT share Jewellery\'s rate. Category ID cross-checked against eBay\'s own category browse page (ebay.co.uk/b/Watches-Parts-Accessories/260324/...).',
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

  // --- Categories with a CONFIRMED reduced per-order fee but an UNCONFIRMED
  // variable FVF (`schedule` omitted deliberately — FVF requires manual entry) ---
  ...([
    { id: 'ANTIQUES', label: 'Antiques', officialCategoryId: '20081' },
    { id: 'ART', label: 'Art', officialCategoryId: '550' },
    { id: 'COINS', label: 'Coins', officialCategoryId: '11116' },
    { id: 'COLLECTABLES', label: 'Collectables', officialCategoryId: '1' },
    { id: 'DOLLS_BEARS', label: 'Dolls & Bears', officialCategoryId: '237' },
    { id: 'POTTERY_GLASS', label: 'Pottery & Glass', officialCategoryId: '870' },
    { id: 'SPORTS_MEMORABILIA', label: 'Sports Memorabilia', officialCategoryId: '64482' },
    { id: 'STAMPS', label: 'Stamps', officialCategoryId: '260' },
    { id: 'HOME_FURNITURE_DIY', label: 'Home, Furniture & DIY', officialCategoryId: undefined },
  ] as const).map(
    (c): CategoryFeeRule => ({
      id: c.id,
      label: c.label,
      officialCategoryId: c.officialCategoryId,
      // No `schedule`: this category's variable Final Value Fee percentage
      // was not found in any source fetched this round — selecting it
      // requires a manual rate, same as UNSUPPORTED_CATEGORY_ID, but the
      // category identity (and its reduced per-order fee) is still real.
      reducedPerOrderFee: {
        fee: EBAY_REDUCED_PER_ORDER_FEE,
        atOrBelowThreshold: EBAY_PER_ORDER_FEE.threshold,
        source: EBAY_REDUCED_PER_ORDER_FEE_SOURCE,
      },
      source: {
        ...EBAY_META,
        feeType: 'final_value_fee',
        effectiveDate: null,
        url: EBAY_SOURCE.url,
        verifiedAt: null,
        verificationStatus: 'AUTOMATED_UNVERIFIED',
        notes: 'Variable Final Value Fee percentage not confirmed for this category — enter a manual rate. Reduced per-order fee eligibility IS confirmed (see reducedPerOrderFee).',
      },
    })
  ),
];

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
