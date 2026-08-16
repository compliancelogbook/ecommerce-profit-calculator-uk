import type { CategoryFeeRule, SourceRef } from './types';

const AMAZON_PRICING_URL = 'https://sell.amazon.co.uk/pricing';
const AMAZON_META = { platform: 'AMAZON', sellerMarket: 'GB', currency: 'GBP' } as const;

export const AMAZON_SOURCE: SourceRef = {
  ...AMAZON_META,
  feeType: 'referral_fee',
  effectiveDate: null,
  url: AMAZON_PRICING_URL,
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

/** Individually confirmed during the 2026-08-16 launch audit against Amazon's
 *  published referral fee terms (not the original build brief). */
export const AMAZON_SOURCE_AUDIT: SourceRef = {
  ...AMAZON_META,
  feeType: 'referral_fee',
  effectiveDate: null,
  url: AMAZON_PRICING_URL,
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
};

/** Extracted via an automated fetch of sell.amazon.co.uk/pricing on 2026-08-16.
 *  Cross-checked against the 9 SPEC_VERIFIED rows below (all matched exactly),
 *  but not independently verified line-by-line beyond that. Only used here for
 *  categories with a single FLAT rate — see the coverage note below for why
 *  multi-bracket AUTOMATED_UNVERIFIED categories were removed rather than kept. */
export const AMAZON_SOURCE_AUTOMATED: SourceRef = {
  ...AMAZON_META,
  feeType: 'referral_fee',
  effectiveDate: null,
  url: AMAZON_PRICING_URL,
  verifiedAt: null,
  verificationStatus: 'AUTOMATED_UNVERIFIED',
  notes:
    'Extracted via automated fetch on 2026-08-16; not independently cross-checked line-by-line against the live page. Confirm before relying on it for high-value decisions.',
};

export const AMAZON_INDIVIDUAL_FEE_PER_UNIT = 0.75; // excl. VAT
export const AMAZON_PROFESSIONAL_MONTHLY_FEE = 25; // excl. VAT

/**
 * Referral fee category schedule.
 *
 * COVERAGE NOTE (2026-08-16 launch audit): the first 9 rows are given
 * verbatim in the original build brief and are exercised by acceptance
 * tests. A prior pass had ALSO auto-calculated ~37 further categories
 * pulled from a single automated fetch, assigning each a marginal-vs-
 * whole-amount threshold "mechanic" by analogy to Home/Beauty or
 * Jewellery/Watches. That was a guess, not a verification, and this audit
 * found at least one concrete error: Automotive & Powersports was modelled
 * as whole-amount when Amazon's own terms describe it as marginal (15% on
 * the portion up to £45, 9% on the portion above) — fixed below and
 * individually confirmed (AUDIT_VERIFIED).
 *
 * For every OTHER multi-bracket ("up to £X / above £X") category, the
 * threshold mechanic remains genuinely unconfirmed — the fetched table
 * states rates and thresholds but never states whether they blend
 * (marginal) or apply to the whole amount (threshold). Rather than repeat
 * the same guess-by-analogy error, those categories have been REMOVED from
 * auto-calculation entirely and now require manual entry
 * (UNSUPPORTED_CATEGORY_ID) — never a silent "Everything Else" fallback.
 * Removed: Baby Products, Baby Pushchairs & Safety Equipment, Reusable Work
 * & Safety Gloves, Clothing & Accessories, Electronic Accessories, Printer &
 * Scanner Accessories, Furniture, Grocery & Gourmet, Pet Clothing & Food,
 * Vitamins/Minerals & Supplements.
 *
 * Single-rate (FLAT) AUTOMATED_UNVERIFIED categories were kept: a flat rate
 * has no mechanic to infer — it was read directly off the primary source
 * page, the same page that exactly matched all 9 SPEC_VERIFIED rows. Their
 * £0.25 minimum fee is likewise the same figure independently confirmed
 * across every SPEC_VERIFIED row on this list, not a category-specific
 * guess. This is disclosed to the user as "unverified" in the UI regardless.
 */
export const AMAZON_CATEGORIES: CategoryFeeRule[] = [
  // --- SPEC_VERIFIED (given in the brief, covered by acceptance tests) ---
  {
    id: 'RUCKSACKS_HANDBAGS',
    label: 'Rucksacks & Handbags',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '15% flat' },
  },
  {
    id: 'TOOLS_HOME_IMPROVEMENT',
    label: 'Tools & Home Improvement',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '13% flat' },
  },
  {
    id: 'TOYS_GAMES',
    label: 'Toys & Games',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '15% flat' },
  },
  {
    id: 'AMAZON_DEVICE_ACCESSORIES',
    label: 'Amazon Device Accessories',
    schedule: { kind: 'FLAT', rate: 0.45 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '45% flat' },
  },
  {
    id: 'BEAUTY',
    label: 'Beauty',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '8% on the whole price up to £10, 15% on the whole price above £10 (whole-amount, not blended)' },
  },
  {
    id: 'HOME',
    label: 'Home',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 20, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '8% on the whole price up to £20, 15% on the whole price above £20 (whole-amount, not blended)' },
  },
  {
    id: 'JEWELLERY',
    label: 'Jewellery',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 225, rate: 0.2 }, { upTo: null, rate: 0.05 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '20% on the portion up to £225, 5% on the portion above' },
  },
  {
    id: 'WATCHES',
    label: 'Watches',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 225, rate: 0.15 }, { upTo: null, rate: 0.05 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '15% on the portion up to £225, 5% on the portion above' },
  },
  {
    id: 'EVERYTHING_ELSE',
    label: 'Everything Else',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '15% flat' },
  },

  // --- AUDIT_VERIFIED (individually corrected during the 2026-08-16 audit) ---
  {
    id: 'AUTOMOTIVE_POWERSPORTS',
    label: 'Automotive and Powersports',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 45, rate: 0.15 }, { upTo: null, rate: 0.09 }] },
    minimumFee: 0.25,
    source: {
      ...AMAZON_SOURCE_AUDIT,
      formula: '15% on the portion up to £45, 9% on the portion above',
      notes: 'Corrected 2026-08-16: previously modelled as whole-amount by unverified analogy; Amazon\'s terms describe this category as marginal/portion-based.',
    },
  },

  // --- AUTOMATED_UNVERIFIED, FLAT ONLY (no mechanic to infer; percentage read directly off the primary source) ---
  {
    id: 'BEER_WINE_SPIRITS',
    label: 'Beer, Wine, Spirits',
    schedule: { kind: 'FLAT', rate: 0.1 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '10% flat' },
  },
  {
    id: 'BOOKS',
    label: 'Books',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'BUSINESS_INDUSTRIAL_SCIENTIFIC',
    label: 'Business, Industrial, Scientific',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'COMPACT_APPLIANCES',
    label: 'Compact Appliances',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'COMMERCIAL_ELECTRICAL_ENERGY',
    label: 'Commercial Electrical & Energy',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '12% flat' },
  },
  {
    id: 'COMPUTERS',
    label: 'Computers',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '7% flat' },
  },
  {
    id: 'CONSUMER_ELECTRONICS',
    label: 'Consumer Electronics',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '7% flat' },
  },
  {
    id: 'CYCLING_ACCESSORIES',
    label: 'Cycling Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'EYEWEAR',
    label: 'Eyewear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'EYEWEAR_PROTECTION',
    label: 'Eyewear Protection',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'FOOTWEAR',
    label: 'Footwear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'FULL_SIZE_APPLIANCES',
    label: 'Full-Size Appliances',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '7% flat' },
  },
  {
    id: 'FURNITURE_ACCESSORIES',
    label: 'Furniture Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '13% flat' },
  },
  {
    id: 'HANDMADE',
    label: 'Handmade',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '12% flat' },
  },
  {
    id: 'KITCHEN',
    label: 'Kitchen',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'HOME_LINEN_RUGS',
    label: 'Home Linen & Rugs',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'LAWN_GARDEN',
    label: 'Lawn & Garden',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'LUGGAGE',
    label: 'Luggage',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'LUGGAGE_ACCESSORIES',
    label: 'Luggage Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'MATTRESSES',
    label: 'Mattresses',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'MUSIC_VIDEO_DVD',
    label: 'Music, Video & DVD',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'MUSICAL_INSTRUMENTS_AV',
    label: 'Musical Instruments & AV',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '12% flat' },
  },
  {
    id: 'OFFICE_PRODUCTS',
    label: 'Office Products',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'PACKING_MATERIALS',
    label: 'Packing Materials',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'PET_SUPPLIES',
    label: 'Pet Supplies',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'SOFTWARE',
    label: 'Software',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'SPORTS_OUTDOORS',
    label: 'Sports & Outdoors',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'TYRES',
    label: 'Tyres',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '7% flat' },
  },
  {
    id: 'DOOR_WINDOW_SHOWER_ACCESSORIES',
    label: 'Door, Window & Shower Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '13% flat' },
  },
  {
    id: 'HOME_ADHESIVES_CABLE_TIES',
    label: 'Home Adhesives & Cable Ties',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '13% flat' },
  },
  {
    id: 'VIDEO_GAMES_GAMING_ACCESSORIES',
    label: 'Video Games & Gaming Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '15% flat' },
  },
  {
    id: 'VIDEO_GAME_CONSOLES',
    label: 'Video Game Consoles',
    schedule: { kind: 'FLAT', rate: 0.08 },
    source: { ...AMAZON_SOURCE_AUTOMATED, formula: '8% flat' },
  },
];
