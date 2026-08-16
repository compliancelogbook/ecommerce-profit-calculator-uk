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

/**
 * Individually confirmed during the 2026-08-16 follow-up launch audit: each
 * category below was fetched by name (not bulk-summarised) and its literal
 * published wording quoted back — categories worded "X% for the portion of
 * the total price up to £Y" are marginal/portion-based (TIERED); categories
 * worded "X% for products/items priced at/up to £Y" are whole-price
 * threshold (THRESHOLD_FLAT), matching the wording distinction already
 * confirmed by acceptance tests for Home/Beauty vs Jewellery/Watches. Where
 * two fetches disagreed (Books' minimum fee), a third, narrower fetch was
 * used to break the tie in favour of the majority/more-specific answer.
 * This is still an AI-summarised fetch, not a personal HTML read — treated
 * as a real verification pass, not infallible.
 */
export const AMAZON_SOURCE_AUDIT: SourceRef = {
  ...AMAZON_META,
  feeType: 'referral_fee',
  effectiveDate: null,
  url: AMAZON_PRICING_URL,
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
};

export const AMAZON_INDIVIDUAL_FEE_PER_UNIT = 0.75; // excl. VAT
export const AMAZON_PROFESSIONAL_MONTHLY_FEE = 25; // excl. VAT

/**
 * Referral fee category schedule. Every category below is either
 * SPEC_VERIFIED (given verbatim in the original build brief, covered by
 * acceptance tests) or AUDIT_VERIFIED (individually confirmed by name
 * during the 2026-08-16 follow-up audit — see AMAZON_SOURCE_AUDIT). No
 * category remains AUTOMATED_UNVERIFIED; see amazon.test.ts for a test
 * that fails the build if one ever becomes auto-selectable again without
 * being upgraded first. Any category NOT listed here still requires
 * manual entry (UNSUPPORTED_CATEGORY_ID) — never a silent guess.
 */
export const AMAZON_CATEGORIES: CategoryFeeRule[] = [
  // --- SPEC_VERIFIED (given in the original brief, covered by acceptance tests) ---
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
    source: { ...AMAZON_SOURCE, formula: '8% for products priced up to £10, 15% for products priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'HOME',
    label: 'Home',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 20, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE, formula: '8% for items priced up to £20, 15% for items priced above £20 (whole-price, not blended)' },
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

  // --- AUDIT_VERIFIED: marginal/portion-based (TIERED) ---
  {
    id: 'AUTOMOTIVE_POWERSPORTS',
    label: 'Automotive and Powersports',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 45, rate: 0.15 }, { upTo: null, rate: 0.09 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% on the portion up to £45, 9% on the portion above ("for the portion of the total price...")' },
  },
  {
    id: 'FURNITURE',
    label: 'Furniture',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 175, rate: 0.15 }, { upTo: null, rate: 0.1 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% on the portion up to £175, 10% on the portion above ("for the portion of the total price...")' },
  },
  {
    id: 'ELECTRONIC_ACCESSORIES',
    label: 'Electronic Accessories',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 100, rate: 0.15 }, { upTo: null, rate: 0.08 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% on the portion up to £100, 8% on the portion above ("for the portion of the total price...")' },
  },
  {
    id: 'PRINTER_SCANNER_ACCESSORIES',
    label: 'Printer & Scanner Accessories',
    schedule: { kind: 'TIERED', tiers: [{ upTo: 100, rate: 0.15 }, { upTo: null, rate: 0.08 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% on the portion up to £100, 8% on the portion above ("for the portion of the total price...")' },
  },

  // --- AUDIT_VERIFIED: whole-price threshold (THRESHOLD_FLAT) ---
  {
    id: 'BABY_PRODUCTS',
    label: 'Baby Products',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '8% for products priced up to £10, 15% for products priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'BABY_PUSHCHAIRS_SAFETY_EQUIPMENT',
    label: 'Baby Pushchairs & Safety Equipment',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '8% for products priced up to £10, 15% for products priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'REUSABLE_WORK_SAFETY_GLOVES',
    label: 'Reusable Work & Safety Gloves',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.08 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '8% for products priced up to £10, 15% for products priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'GROCERY_GOURMET',
    label: 'Grocery & Gourmet',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '5% for products priced up to £10, 15% for products priced above £10 (whole-price, not blended); no minimum fee stated' },
  },
  {
    id: 'PET_CLOTHING_FOOD',
    label: 'Pet Clothing & Food',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '5% for items priced up to £10, 15% for items priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'VITAMINS_MINERALS_SUPPLEMENTS',
    label: 'Vitamins, Minerals & Supplements',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 10, rate: 0.05 }, { upTo: null, rate: 0.15 }] },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '5% for items priced up to £10, 15% for items priced above £10 (whole-price, not blended)' },
  },
  {
    id: 'CLOTHING_ACCESSORIES',
    label: 'Clothing & Accessories',
    schedule: {
      kind: 'THRESHOLD_FLAT',
      tiers: [{ upTo: 15, rate: 0.05 }, { upTo: 20, rate: 0.1 }, { upTo: null, rate: 0.15 }],
    },
    minimumFee: 0.25,
    source: {
      ...AMAZON_SOURCE_AUDIT,
      formula: '5% for items priced at/up to £15, 10% for items priced £15-£20, 15% for items priced above £20 (whole-price, not blended)',
    },
  },

  // --- AUDIT_VERIFIED: flat, individually confirmed by name ---
  {
    id: 'BEER_WINE_SPIRITS',
    label: 'Beer, Wine, Spirits',
    schedule: { kind: 'FLAT', rate: 0.1 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '10% flat' },
  },
  {
    id: 'BOOKS',
    label: 'Books',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat; minimum fee "not applicable" (confirmed via a dedicated single-category fetch after an initial bulk fetch incorrectly implied £0.25)' },
  },
  {
    id: 'BUSINESS_INDUSTRIAL_SCIENTIFIC',
    label: 'Business, Industrial, Scientific',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'COMPACT_APPLIANCES',
    label: 'Compact Appliances',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'COMMERCIAL_ELECTRICAL_ENERGY',
    label: 'Commercial Electrical & Energy',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '12% flat' },
  },
  {
    id: 'COMPUTERS',
    label: 'Computers',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '7% flat' },
  },
  {
    id: 'CONSUMER_ELECTRONICS',
    label: 'Consumer Electronics',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '7% flat' },
  },
  {
    id: 'CYCLING_ACCESSORIES',
    label: 'Cycling Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'EYEWEAR',
    label: 'Eyewear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'EYEWEAR_PROTECTION',
    label: 'Eyewear Protection',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'FOOTWEAR',
    label: 'Footwear',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'FULL_SIZE_APPLIANCES',
    label: 'Full-Size Appliances',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '7% flat' },
  },
  {
    id: 'FURNITURE_ACCESSORIES',
    label: 'Furniture Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '13% flat' },
  },
  {
    id: 'HANDMADE',
    label: 'Handmade',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '12% flat' },
  },
  {
    id: 'KITCHEN',
    label: 'Kitchen',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'HOME_LINEN_RUGS',
    label: 'Home Linen & Rugs',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'LAWN_GARDEN',
    label: 'Lawn & Garden',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'LUGGAGE',
    label: 'Luggage',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'LUGGAGE_ACCESSORIES',
    label: 'Luggage Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'MATTRESSES',
    label: 'Mattresses',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'MUSIC_VIDEO_DVD',
    label: 'Music, Video & DVD',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat; minimum fee not applicable' },
  },
  {
    id: 'MUSICAL_INSTRUMENTS_AV',
    label: 'Musical Instruments & AV',
    schedule: { kind: 'FLAT', rate: 0.12 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '12% flat' },
  },
  {
    id: 'OFFICE_PRODUCTS',
    label: 'Office Products',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'PACKING_MATERIALS',
    label: 'Packing Materials',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'PET_SUPPLIES',
    label: 'Pet Supplies',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'SOFTWARE',
    label: 'Software',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat; minimum fee not applicable' },
  },
  {
    id: 'SPORTS_OUTDOORS',
    label: 'Sports & Outdoors',
    schedule: { kind: 'FLAT', rate: 0.15 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat' },
  },
  {
    id: 'TYRES',
    label: 'Tyres',
    schedule: { kind: 'FLAT', rate: 0.07 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '7% flat' },
  },
  {
    id: 'DOOR_WINDOW_SHOWER_ACCESSORIES',
    label: 'Door, Window & Shower Accessories',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '13% flat' },
  },
  {
    id: 'HOME_ADHESIVES_CABLE_TIES',
    label: 'Home Adhesives & Cable Ties',
    schedule: { kind: 'FLAT', rate: 0.13 },
    minimumFee: 0.25,
    source: { ...AMAZON_SOURCE_AUDIT, formula: '13% flat' },
  },
  {
    id: 'VIDEO_GAMES_GAMING_ACCESSORIES',
    label: 'Video Games & Gaming Accessories',
    schedule: { kind: 'FLAT', rate: 0.15 },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '15% flat; minimum fee not applicable' },
  },
  {
    id: 'VIDEO_GAME_CONSOLES',
    label: 'Video Game Consoles',
    schedule: { kind: 'FLAT', rate: 0.08 },
    source: { ...AMAZON_SOURCE_AUDIT, formula: '8% flat; minimum fee not applicable' },
  },
];
