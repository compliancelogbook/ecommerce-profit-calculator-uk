import type { CategoryFeeRule, SourceRef } from './types';

const AMAZON_PRICING_URL = 'https://sell.amazon.co.uk/pricing';

export const AMAZON_SOURCE: SourceRef = {
  url: AMAZON_PRICING_URL,
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

/** Extracted via an automated fetch of sell.amazon.co.uk/pricing on 2026-08-16.
 *  Cross-checked against the 9 SPEC_VERIFIED rows below (all matched exactly),
 *  but not independently verified line-by-line beyond that — treat as a
 *  starting point to confirm manually, not a guaranteed-accurate figure. */
export const AMAZON_SOURCE_AUTOMATED: SourceRef = {
  url: AMAZON_PRICING_URL,
  verifiedAt: null,
  verificationStatus: 'AUTOMATED_UNVERIFIED',
  notes:
    'Extracted via automated fetch on 2026-08-16; not independently cross-checked line-by-line against the live page. Confirm before relying on it for high-value decisions.',
};

export const AMAZON_INDIVIDUAL_FEE_PER_UNIT = 0.75; // excl. VAT
export const AMAZON_PROFESSIONAL_MONTHLY_FEE = 25; // excl. VAT

/**
 * Referral fee category schedule. The first 9 rows below are given verbatim
 * in the brief this dataset was built against and are exercised by
 * acceptance tests (SPEC_VERIFIED). The remainder were pulled from a live
 * fetch of the official pricing page (AUTOMATED_UNVERIFIED) to broaden
 * coverage per your "best-effort expand" decision — every spec-given example
 * cross-checked exactly against the fetched table, which is reassuring but
 * not the same as a manual line-by-line audit. Any category not listed here
 * resolves to UNSUPPORTED_CATEGORY_ID and requires explicit manual entry.
 *
 * MARGINAL vs THRESHOLD mechanic: acceptance tests confirm Home is a
 * whole-amount THRESHOLD_FLAT category (£30 in an "8% up to £20 / 15% above"
 * category charges flat 15% on the full £30, not a blend — see A04), while
 * Jewellery/Watches are confirmed marginal TIERED categories (spec text says
 * "on the portion up to/above" — see A05). Beauty shares Home's exact
 * phrasing pattern in the brief, so it is also modelled as THRESHOLD_FLAT.
 * The other multi-bracket AUTOMATED_UNVERIFIED categories below are modelled
 * by analogy (low-threshold "everyday goods" categories as THRESHOLD_FLAT
 * like Home/Beauty; high-threshold categories as marginal TIERED like
 * Jewellery/Watches) — this grouping is NOT independently confirmed and
 * should be verified against Amazon's live referral fee page before relying
 * on it for any category other than the 9 SPEC_VERIFIED rows.
 */
export const AMAZON_CATEGORIES: CategoryFeeRule[] = [
  // --- SPEC_VERIFIED (given in the brief, covered by acceptance tests) ---
  {
    id: 'RUCKSACKS_HANDBAGS',
    label: 'Rucksacks & Handbags',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'TOOLS_HOME_IMPROVEMENT',
    label: 'Tools & Home Improvement',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'TOYS_GAMES',
    label: 'Toys & Games',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'AMAZON_DEVICE_ACCESSORIES',
    label: 'Amazon Device Accessories',
    schedule: { kind: 'FLAT', rate: 0.45 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'BEAUTY',
    label: 'Beauty',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'HOME',
    label: 'Home',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 20, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'JEWELLERY',
    label: 'Jewellery',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 225, rate: 0.2 }, { upTo: null, rate: 0.05 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'WATCHES',
    label: 'Watches',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 225, rate: 0.15 }, { upTo: null, rate: 0.05 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },
  {
    id: 'EVERYTHING_ELSE',
    label: 'Everything Else',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE,
  },

  // --- AUTOMATED_UNVERIFIED (broadened coverage, confirm before relying on) ---
  {
    id: 'AUTOMOTIVE_POWERSPORTS',
    label: 'Automotive and Powersports',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 45, rate: 0.15 }, { upTo: null, rate: 0.09 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'BABY_PRODUCTS',
    label: 'Baby Products',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'BABY_PUSHCHAIRS_SAFETY_EQUIPMENT',
    label: 'Baby Pushchairs & Safety Equipment',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'REUSABLE_WORK_SAFETY_GLOVES',
    label: 'Reusable Work & Safety Gloves',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'BEER_WINE_SPIRITS',
    label: 'Beer, Wine, Spirits',
    schedule: { kind: 'FLAT', rate: 0.1 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'BOOKS',
    label: 'Books',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'BUSINESS_INDUSTRIAL_SCIENTIFIC',
    label: 'Business, Industrial, Scientific',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'COMPACT_APPLIANCES',
    label: 'Compact Appliances',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'CLOTHING_ACCESSORIES',
    label: 'Clothing & Accessories',
    schedule: {
      kind: 'TIERED',
      tiers: [{ upTo: 15, rate: 0.05 }, { upTo: 20, rate: 0.1 }, { upTo: null, rate: 0.15 }],
    },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'COMMERCIAL_ELECTRICAL_ENERGY',
    label: 'Commercial Electrical & Energy',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'COMPUTERS',
    label: 'Computers',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'CONSUMER_ELECTRONICS',
    label: 'Consumer Electronics',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'CYCLING_ACCESSORIES',
    label: 'Cycling Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'ELECTRONIC_ACCESSORIES',
    label: 'Electronic Accessories',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 100, rate: 0.15 }, { upTo: null, rate: 0.08 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'PRINTER_SCANNER_ACCESSORIES',
    label: 'Printer & Scanner Accessories',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 100, rate: 0.15 }, { upTo: null, rate: 0.08 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'EYEWEAR',
    label: 'Eyewear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'EYEWEAR_PROTECTION',
    label: 'Eyewear Protection',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'FOOTWEAR',
    label: 'Footwear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'FULL_SIZE_APPLIANCES',
    label: 'Full-Size Appliances',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'FURNITURE',
    label: 'Furniture',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 175, rate: 0.15 }, { upTo: null, rate: 0.1 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'FURNITURE_ACCESSORIES',
    label: 'Furniture Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'GROCERY_GOURMET',
    label: 'Grocery & Gourmet',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'HANDMADE',
    label: 'Handmade',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'KITCHEN',
    label: 'Kitchen',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'HOME_LINEN_RUGS',
    label: 'Home Linen & Rugs',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'LAWN_GARDEN',
    label: 'Lawn & Garden',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'LUGGAGE',
    label: 'Luggage',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'LUGGAGE_ACCESSORIES',
    label: 'Luggage Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'MATTRESSES',
    label: 'Mattresses',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'MUSIC_VIDEO_DVD',
    label: 'Music, Video & DVD',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'MUSICAL_INSTRUMENTS_AV',
    label: 'Musical Instruments & AV',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'OFFICE_PRODUCTS',
    label: 'Office Products',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'PACKING_MATERIALS',
    label: 'Packing Materials',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'PET_SUPPLIES',
    label: 'Pet Supplies',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'PET_CLOTHING_FOOD',
    label: 'Pet Clothing & Food',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'SOFTWARE',
    label: 'Software',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'SPORTS_OUTDOORS',
    label: 'Sports & Outdoors',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'TYRES',
    label: 'Tyres',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'DOOR_WINDOW_SHOWER_ACCESSORIES',
    label: 'Door, Window & Shower Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'HOME_ADHESIVES_CABLE_TIES',
    label: 'Home Adhesives & Cable Ties',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'VIDEO_GAMES_GAMING_ACCESSORIES',
    label: 'Video Games & Gaming Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'VIDEO_GAME_CONSOLES',
    label: 'Video Game Consoles',
    schedule: { kind: 'FLAT', rate: 0.08 },
    source: AMAZON_SOURCE_AUTOMATED,
  },
  {
    id: 'VITAMINS_MINERALS_SUPPLEMENTS',
    label: 'Vitamins, Minerals & Supplements',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: AMAZON_SOURCE_AUTOMATED,
  },
];
