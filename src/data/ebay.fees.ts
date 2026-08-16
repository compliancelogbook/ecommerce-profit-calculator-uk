import type { CategoryFeeRule, FeeTier, SourceRef } from './types';

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
 * 2026-08-16 third audit pass: a complete rendered capture of eBay's
 * official UK Business Seller fees page was supplied directly (JSON table
 * transcription cross-checked line-by-line against the full rendered text —
 * both agree). This is the primary source for the full category schedule
 * below. The page itself states "Last updated on 4 August, 2026"
 * (effectiveDate); the capture was reviewed 2026-08-16 (verifiedAt). This
 * was NOT obtained by this build fetching the page — no further fetch
 * attempts were made this round per instruction.
 */
export const EBAY_SOURCE_2026_08_04: SourceRef = {
  ...EBAY_META,
  feeType: 'final_value_fee',
  effectiveDate: '2026-08-04',
  url: 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/fees-business-sellers?id=4809',
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Sourced from a complete official-page capture (rendered text + structured JSON table transcription, cross-checked against each other) supplied directly for this audit pass.',
};

export const EBAY_PER_ORDER_FEE = {
  threshold: 10, // total sale <= £10
  atOrBelow: 0.3,
  above: 0.4,
};

export const EBAY_PER_ORDER_FEE_SOURCE: SourceRef = {
  ...EBAY_SOURCE_2026_08_04,
  feeType: 'per_order_fee',
  formula: '£0.30 for a total sale ≤ £10, £0.40 for a total sale > £10',
};

/**
 * Reduced 10p (instead of 30p) per-order fee for qualifying orders with a
 * total sale price ≤ £10. The official page confirms the mechanism
 * ("Listings created on or after 1 February 2022 in selected Collectables
 * categories... 19 April 2022 in Home, Furniture & DIY categories") but
 * links out to a separate page for the specific qualifying subcategory
 * list — that specific list was confirmed via direct fetches of eBay's
 * community announcement pages during the prior audit pass, and every one
 * of those category IDs is independently corroborated by this capture's
 * category table (cross-checked below).
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
    'Qualifying category IDs confirmed via direct community.ebay.co.uk fetches (prior audit pass) and independently corroborated against this capture\'s official category ID table (this audit pass) — every ID matches exactly.',
};

function reduced(): CategoryFeeRule['reducedPerOrderFee'] {
  return { fee: EBAY_REDUCED_PER_ORDER_FEE, atOrBelowThreshold: EBAY_PER_ORDER_FEE.threshold, source: EBAY_REDUCED_PER_ORDER_FEE_SOURCE };
}

// --- Shared tier shapes (identical rate/threshold repeated across several
// distinct official categories) — defined once to remove transcription risk. ---
const TIER_6_9_AT_1000_THEN_3: FeeTier[] = [{ upTo: 1000, rate: 0.069 }, { upTo: null, rate: 0.03 }];
const TIER_6_9_AT_750_THEN_3: FeeTier[] = [{ upTo: 750, rate: 0.069 }, { upTo: null, rate: 0.03 }];
const TIER_3_HOME_PLUMBING: FeeTier[] = [
  { upTo: 500, rate: 0.109 },
  { upTo: 1000, rate: 0.079 },
  { upTo: null, rate: 0.03 },
];

function flat(rate: number): CategoryFeeRule['schedule'] {
  return { kind: 'FLAT', rate };
}
function tieredPerItem(tiers: FeeTier[]): { schedule: CategoryFeeRule['schedule']; tierBasis: 'PER_ITEM' } {
  return { schedule: { kind: 'TIERED', tiers }, tierBasis: 'PER_ITEM' };
}

function sourceFor(row: { officialCategoryId?: string; formula: string; notes?: string }): SourceRef {
  return { ...EBAY_SOURCE_2026_08_04, formula: row.formula, notes: row.notes };
}

/**
 * Complete eBay UK Business Seller final value fee category schedule, as
 * published on the official fees page (captured 2026-08-16, page itself
 * dated 4 August 2026). Every row below corresponds directly to a row in
 * that page's "Final value fees by category" table — nothing here was
 * inferred or extrapolated beyond what the source states. A small number
 * of genuinely ambiguous items are called out explicitly in comments
 * rather than guessed (see "Tyres" below).
 *
 * The eight categories carried over from the original build brief
 * (CLOTHES_SHOES_ACCESSORIES, WOMENS_BAGS_HANDBAGS, JEWELLERY,
 * WATCHES_PARTS_ACCESSORIES, MOBILE_PHONES, SMARTPHONES,
 * BUSINESS_OFFICE_INDUSTRIAL, EVERYTHING_ELSE) keep their SPEC_VERIFIED
 * status — their rates are unchanged and are independently reconfirmed by
 * this capture. Every other row is AUDIT_VERIFIED against this capture.
 *
 * Explicitly OUT OF SCOPE (not modelled): Classified Ad listing format
 * (no FVF applies to that format at all), listing upgrade fees (Reserve
 * Price, Subtitle, Gallery Plus, etc. — charged at listing time, not on
 * sale), the dispute fee, and seller-performance-based fee penalties
 * (already disclosed as excluded — see the engine's exclusions list).
 */
export const EBAY_CATEGORIES: CategoryFeeRule[] = [
  // === Original 8, SPEC_VERIFIED, now with official IDs added and cross-confirmed ===
  {
    id: 'CLOTHES_SHOES_ACCESSORIES',
    label: 'Clothes, Shoes & Accessories',
    officialCategoryId: '11450',
    schedule: flat(0.119),
    source: { ...EBAY_SOURCE, formula: '11.9% flat', notes: 'Official ID and rate cross-confirmed by the 2026-08-04 capture. Excludes published subcategories with their own rate (e.g. Women\'s Bags & Handbags, Trainers) — select those separately if applicable.' },
  },
  {
    id: 'WOMENS_BAGS_HANDBAGS',
    label: "Women's Bags & Handbags",
    officialCategoryId: '169291',
    ...tieredPerItem([{ upTo: 800, rate: 0.129 }, { upTo: null, rate: 0.07 }]),
    source: { ...EBAY_SOURCE, formula: '12.9% on the portion up to £800 per item, 7% on the portion above', notes: 'Cross-confirmed by the 2026-08-04 capture.' },
  },
  {
    id: 'JEWELLERY',
    label: 'Jewellery',
    officialCategoryId: '281',
    ...tieredPerItem([{ upTo: 1000, rate: 0.149 }, { upTo: null, rate: 0.04 }]),
    source: {
      ...EBAY_SOURCE,
      formula: '14.9% on the portion up to £1,000 per item, 4% on the portion above',
      notes:
        'Cross-confirmed by the 2026-08-04 capture, where the official category name is "Jewellery & Watches, except subcategories below" (#281) — this app labels it "Jewellery" for clarity since Watches, Parts & Accessories (#260324, listed separately) does NOT share this rate.',
    },
  },
  {
    id: 'WATCHES_PARTS_ACCESSORIES',
    label: 'Watches, Parts & Accessories',
    officialCategoryId: '260324',
    ...tieredPerItem([{ upTo: 750, rate: 0.129 }, { upTo: null, rate: 0.03 }]),
    source: { ...EBAY_SOURCE, formula: '12.9% on the portion up to £750 per item, 3% on the portion above', notes: 'Cross-confirmed by the 2026-08-04 capture.' },
  },
  {
    id: 'MOBILE_PHONES',
    label: 'Mobile Phones & Communication',
    officialCategoryId: '15032',
    schedule: flat(0.099),
    source: { ...EBAY_SOURCE, formula: '9.9% flat', notes: 'Cross-confirmed by the 2026-08-04 capture; official name is "Mobile Phones & Communication". Excludes the Mobile & Smart Phones subcategory (see Smartphones).' },
  },
  {
    id: 'SMARTPHONES',
    label: 'Smartphones',
    officialCategoryId: '9355',
    ...tieredPerItem(TIER_6_9_AT_1000_THEN_3),
    source: { ...EBAY_SOURCE, formula: '6.9% on the portion up to £1,000 per item, 3% on the portion above', notes: 'Official name "Mobile & Smart Phones". Cross-confirmed by the 2026-08-04 capture.' },
  },
  {
    id: 'BUSINESS_OFFICE_INDUSTRIAL',
    label: 'Business, Office & Industrial',
    officialCategoryId: '12576',
    schedule: flat(0.125),
    source: { ...EBAY_SOURCE, formula: '12.5% flat', notes: 'Cross-confirmed by the 2026-08-04 capture.' },
  },
  {
    id: 'EVERYTHING_ELSE',
    label: 'Everything Else',
    officialCategoryId: '99',
    schedule: flat(0.129),
    source: { ...EBAY_SOURCE, formula: '12.9% flat', notes: 'Cross-confirmed by the 2026-08-04 capture. Excludes Memorials & Funerals subcategory (its own, lower rate — listed separately).' },
  },

  // === Everything below is AUDIT_VERIFIED against the 2026-08-04 capture ===

  { id: 'ANTIQUES', label: 'Antiques', officialCategoryId: '20081', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'ART', label: 'Art', officialCategoryId: '550', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat', notes: 'Excludes Art NFTs subcategory (own rate).' }) },
  { id: 'ART_NFTS', label: 'Art NFTs', officialCategoryId: '262051', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'BABY', label: 'Baby', officialCategoryId: '2984', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'BOOKS_COMICS_MAGAZINES', label: 'Books, Comics & Magazines', officialCategoryId: '267', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat' }) },
  { id: 'CAMERAS_PHOTOGRAPHY', label: 'Cameras & Photography', officialCategoryId: '625', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes Camcorders, Digital Cameras, Film Photography, Lenses & Filters (own rate).' }) },
  { id: 'CAMCORDERS', label: 'Camcorders', officialCategoryId: '11724', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'DIGITAL_CAMERAS', label: 'Digital Cameras', officialCategoryId: '31388', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'FILM_PHOTOGRAPHY', label: 'Film Photography', officialCategoryId: '69323', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'LENSES_FILTERS', label: 'Lenses & Filters', officialCategoryId: '78997', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'COINS', label: 'Coins', officialCategoryId: '11116', ...tieredPerItem([{ upTo: 450, rate: 0.109 }, { upTo: null, rate: 0.03 }]), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% on the portion up to £450 per item, 3% above' }) },
  { id: 'COLLECTABLES', label: 'Collectables', officialCategoryId: '1', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat', notes: 'Excludes Emerging NFTs, Non-Sport Trading Card NFTs subcategories (own rate).' }) },
  { id: 'EMERGING_NFTS', label: 'Emerging NFTs', officialCategoryId: '262050', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'NON_SPORT_TRADING_CARD_NFTS', label: 'Non-Sport Trading Card NFTs', officialCategoryId: '262052', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'COMPUTERS_TABLETS_NETWORKING', label: 'Computers, Tablets & Networking', officialCategoryId: '58058', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes several subcategories with their own rate (Desktops, Drives/Storage, Enterprise Networking, Tablets, Laptops, Printers/Scanners).' }) },
  { id: 'DESKTOPS_ALL_IN_ONES', label: 'Desktops & All-In-Ones', officialCategoryId: '171957', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'DRIVES_STORAGE_BLANK_MEDIA', label: 'Drives, Storage & Blank Media', officialCategoryId: '165', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'ENTERPRISE_NETWORKING_SERVERS', label: 'Enterprise Networking, Servers', officialCategoryId: '175698', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'TABLETS_EBOOK_READERS', label: 'Tablets & eBook Readers', officialCategoryId: '171485', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'LAPTOPS_NETBOOKS', label: 'Laptops & Netbooks', officialCategoryId: '175672', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'PRINTERS_SCANNERS_SUPPLIES', label: 'Printers, Scanners & Supplies', officialCategoryId: '171961', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'CRAFTS', label: 'Crafts', officialCategoryId: '14339', schedule: flat(0.129), source: sourceFor({ formula: '12.9% flat' }) },
  { id: 'DOLLS_BEARS', label: 'Dolls & Bears', officialCategoryId: '237', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'EVENT_TICKETS', label: 'Event Tickets', officialCategoryId: '1305', schedule: flat(0.129), source: sourceFor({ formula: '12.9% flat' }) },
  { id: 'FILMS_TV', label: 'Films & TV', officialCategoryId: '11232', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes Film NFTs subcategory (own rate).' }) },
  { id: 'FILM_NFTS', label: 'Film NFTs', officialCategoryId: '262053', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'GARDEN_PATIO', label: 'Garden & Patio', officialCategoryId: '159912', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'HEALTH_BEAUTY', label: 'Health & Beauty', officialCategoryId: '26395', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat', notes: 'Excludes Hair Extensions & Wigs, Electronic Smoking Parts & Accessories subcategories (own rate).' }) },
  { id: 'HAIR_EXTENSIONS_WIGS', label: 'Hair Extensions & Wigs', officialCategoryId: '182101', schedule: flat(0.119), source: sourceFor({ formula: '11.9% flat' }) },
  { id: 'ELECTRONIC_SMOKING', label: 'Electronic Smoking, Parts & Accessories', officialCategoryId: '183497', schedule: flat(0.129), source: sourceFor({ formula: '12.9% flat' }) },
  { id: 'HOLIDAYS_TRAVEL', label: 'Holidays & Travel', officialCategoryId: '3252', ...tieredPerItem([{ upTo: 650, rate: 0.079 }, { upTo: null, rate: 0.03 }]), source: sourceFor({ formula: '7.9% on the portion up to £650 per item, 3% above' }) },
  {
    id: 'HOME_FURNITURE_DIY',
    label: 'Home, Furniture & DIY',
    officialCategoryId: '11700',
    ...tieredPerItem([{ upTo: 500, rate: 0.119 }, { upTo: null, rate: 0.079 }]),
    reducedPerOrderFee: reduced(),
    source: sourceFor({ formula: '11.9% on the portion up to £500 per item, 7.9% above', notes: 'Excludes Appliances, DIY Tools, Power Strips, Furniture, Bath, Other Home Plumbing subcategories (own rates).' }),
  },
  { id: 'APPLIANCES', label: 'Appliances', officialCategoryId: '20710', ...tieredPerItem([{ upTo: 400, rate: 0.069 }, { upTo: null, rate: 0.03 }]), source: sourceFor({ formula: '6.9% on the portion up to £400 per item, 3% above' }) },
  { id: 'DIY_TOOLS_WORKSHOP_EQUIPMENT', label: 'DIY Tools & Workshop Equipment', officialCategoryId: '631', ...tieredPerItem([{ upTo: 400, rate: 0.069 }, { upTo: null, rate: 0.03 }]), source: sourceFor({ formula: '6.9% on the portion up to £400 per item, 3% above' }) },
  { id: 'POWER_STRIPS_SURGE_PROTECTORS', label: 'Power Strips & Surge Protectors', officialCategoryId: '67779', ...tieredPerItem([{ upTo: 250, rate: 0.099 }, { upTo: null, rate: 0.079 }]), source: sourceFor({ formula: '9.9% on the portion up to £250 per item, 7.9% above' }) },
  { id: 'FURNITURE', label: 'Furniture', officialCategoryId: '3197', ...tieredPerItem(TIER_3_HOME_PLUMBING), source: sourceFor({ formula: '10.9% up to £500, 7.9% £500-£1,000, 3% above £1,000 (all per item)' }) },
  { id: 'BATH', label: 'Bath', officialCategoryId: '26677', ...tieredPerItem(TIER_3_HOME_PLUMBING), source: sourceFor({ formula: '10.9% up to £500, 7.9% £500-£1,000, 3% above £1,000 (all per item)' }) },
  { id: 'OTHER_HOME_PLUMBING_FIXTURES', label: 'Other Home Plumbing & Fixtures', officialCategoryId: '3191', ...tieredPerItem(TIER_3_HOME_PLUMBING), source: sourceFor({ formula: '10.9% up to £500, 7.9% £500-£1,000, 3% above £1,000 (all per item)' }) },
  { id: 'MUSIC', label: 'Music', officialCategoryId: '11233', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes Music NFTs subcategory (own rate).' }) },
  { id: 'MUSIC_NFTS', label: 'Music NFTs', officialCategoryId: '262054', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'MUSICAL_INSTRUMENTS_DJ_EQUIPMENT', label: 'Musical Instruments & DJ Equipment', officialCategoryId: '619', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'PET_SUPPLIES', label: 'Pet Supplies', officialCategoryId: '1281', schedule: flat(0.129), source: sourceFor({ formula: '12.9% flat' }) },
  { id: 'POTTERY_GLASS', label: 'Pottery, Ceramics & Glass', officialCategoryId: '870', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'SOUND_VISION', label: 'Sound & Vision', officialCategoryId: '293', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes DVD/Blu-ray, Headphones, Home Audio & HiFi Separates, Televisions subcategories (own rate).' }) },
  { id: 'DVD_BLURAY_HOME_CINEMA', label: 'DVD, Blu-ray & Home Cinema', officialCategoryId: '32852', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'HEADPHONES', label: 'Headphones', officialCategoryId: '112529', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'HOME_AUDIO_HIFI_SEPARATES', label: 'Home Audio & HiFi Separates', officialCategoryId: '14969', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'TELEVISIONS', label: 'Televisions', officialCategoryId: '11071', ...tieredPerItem(TIER_6_9_AT_1000_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £1,000 per item, 3% above' }) },
  { id: 'SPORTING_GOODS', label: 'Sporting Goods', officialCategoryId: '888', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'SPORTS_MEMORABILIA', label: 'Sports Memorabilia', officialCategoryId: '64482', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat', notes: 'Excludes Sport Trading Card NFTs subcategory (own rate).' }) },
  { id: 'SPORT_TRADING_CARD_NFTS', label: 'Sport Trading Card NFTs', officialCategoryId: '262055', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'STAMPS', label: 'Stamps', officialCategoryId: '260', schedule: flat(0.109), reducedPerOrderFee: reduced(), source: sourceFor({ formula: '10.9% flat' }) },
  { id: 'TOYS_GAMES', label: 'Toys & Games', officialCategoryId: '220', schedule: flat(0.109), source: sourceFor({ formula: '10.9% flat', notes: 'Excludes CCG NFTs, Tents subcategories (own rate).' }) },
  { id: 'CCG_NFTS', label: 'CCG NFTs', officialCategoryId: '262056', schedule: flat(0.05), source: sourceFor({ formula: '5% flat' }) },
  { id: 'TENTS', label: 'Tents', officialCategoryId: '117213', ...tieredPerItem([{ upTo: 250, rate: 0.109 }, { upTo: null, rate: 0.079 }]), source: sourceFor({ formula: '10.9% on the portion up to £250 per item, 7.9% above' }) },
  {
    id: 'VEHICLE_PARTS_ACCESSORIES',
    label: 'Vehicle Parts & Accessories',
    officialCategoryId: '131090',
    ...tieredPerItem([{ upTo: 750, rate: 0.095 }, { upTo: null, rate: 0.03 }]),
    source: sourceFor({ formula: '9.5% on the portion up to £750 per item, 3% above', notes: 'Excludes Tyres, GPS & Sat Nav Devices, Power Tools & Equipment subcategories (own rate).' }),
  },
  {
    // The official table lists "Tyres" twice against two different category IDs (#179680 and #124313),
    // both sharing the same rate — both the JSON transcription and the rendered text independently show
    // this exact duplication, so it is faithfully preserved as two distinct entries rather than merged or
    // treated as an error, per "do not infer anything absent from the source".
    id: 'VEHICLE_TYRES_1',
    label: 'Tyres',
    officialCategoryId: '179680',
    ...tieredPerItem(TIER_6_9_AT_750_THEN_3),
    source: sourceFor({ formula: '6.9% on the portion up to £750 per item, 3% above', notes: 'The source table lists two distinct "Tyres" category IDs (179680, 124313) with this same rate — preserved as-is.' }),
  },
  {
    id: 'VEHICLE_TYRES_2',
    label: 'Tyres',
    officialCategoryId: '124313',
    ...tieredPerItem(TIER_6_9_AT_750_THEN_3),
    source: sourceFor({ formula: '6.9% on the portion up to £750 per item, 3% above', notes: 'The source table lists two distinct "Tyres" category IDs (179680, 124313) with this same rate — preserved as-is.' }),
  },
  { id: 'GPS_SAT_NAV_DEVICES', label: 'GPS & Sat Nav Devices', officialCategoryId: '139835', ...tieredPerItem(TIER_6_9_AT_750_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £750 per item, 3% above' }) },
  { id: 'POWER_TOOLS_EQUIPMENT', label: 'Power Tools & Equipment', officialCategoryId: '35000', ...tieredPerItem(TIER_6_9_AT_750_THEN_3), source: sourceFor({ formula: '6.9% on the portion up to £750 per item, 3% above' }) },
  { id: 'VIDEO_GAMES_CONSOLES', label: 'Video Games & Consoles', officialCategoryId: '1249', schedule: flat(0.099), source: sourceFor({ formula: '9.9% flat', notes: 'Excludes Video Game Consoles subcategory (own rate).' }) },
  { id: 'VIDEO_GAME_CONSOLES', label: 'Video Game Consoles', officialCategoryId: '139971', ...tieredPerItem([{ upTo: 400, rate: 0.069 }, { upTo: null, rate: 0.02 }]), source: sourceFor({ formula: '6.9% on the portion up to £400 per item, 2% above' }) },
  { id: 'WHOLESALE_JOB_LOTS', label: 'Wholesale & Job Lots', officialCategoryId: '40005', schedule: flat(0.129), source: sourceFor({ formula: '12.9% flat' }) },
  { id: 'MEMORIALS_FUNERALS', label: 'Memorials & Funerals', officialCategoryId: '88739', schedule: flat(0.119), source: sourceFor({ formula: '11.9% flat' }) },

  // Whole-price threshold on a basis that EXCLUDES postage (confirmed explicitly by the source:
  // "*The item selling price excludes postage, and any other additional fees or taxes"). £99.99 is
  // used as the inclusive upper bound of the lower tier — an exact, not approximate, representation
  // at penny-precision currency, since the source states the 7% rate applies "if... £100 or more".
  {
    id: 'MENS_TRAINERS',
    label: "Men's Shoes: Trainers",
    officialCategoryId: '15709',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 99.99, rate: 0.119 }, { upTo: null, rate: 0.07 }] },
    tierBasis: 'PER_ITEM',
    thresholdExcludesPostage: true,
    source: sourceFor({ formula: '11.9% below £100 item price (excl. postage), 7% at £100 or more', notes: 'Category path: Men > Men\'s Shoes > Trainers.' }),
  },
  {
    id: 'WOMENS_TRAINERS',
    label: "Women's Shoes: Trainers",
    officialCategoryId: '95672',
    schedule: { kind: 'THRESHOLD_FLAT', tiers: [{ upTo: 99.99, rate: 0.119 }, { upTo: null, rate: 0.07 }] },
    tierBasis: 'PER_ITEM',
    thresholdExcludesPostage: true,
    source: sourceFor({ formula: '11.9% below £100 item price (excl. postage), 7% at £100 or more', notes: 'Category path: Women > Women\'s Shoes > Trainers.' }),
  },
];

export const EBAY_REGULATORY_FEE_RATE = 0.0035;

export const EBAY_REGULATORY_FEE_SOURCE: SourceRef = {
  ...EBAY_SOURCE_2026_08_04,
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
  ...EBAY_SOURCE_2026_08_04,
  feeType: 'international_fee',
  formula: 'Domestic 0%, Eurozone/Northern Europe 1.05%, US/Canada 1.8%, Other 2.0%',
  notes: 'Northern Europe defined by the source as Denmark, Finland, Iceland, Norway, Sweden.',
};

export const EBAY_CURRENCY_CONVERSION_RATE = 0.025;

export const EBAY_CURRENCY_CONVERSION_SOURCE: SourceRef = {
  ...EBAY_SOURCE_2026_08_04,
  feeType: 'currency_conversion_fee',
  formula: '2.5% of the relevant basis',
  conditions: 'Applies only when eBay performs currency conversion on the order.',
};

/** Applied only to the variable Final Value Fee component when eligible. */
export const EBAY_TOP_RATED_DISCOUNT_RATE = 0.1;

export const EBAY_TOP_RATED_SOURCE: SourceRef = {
  ...EBAY_SOURCE_2026_08_04,
  feeType: 'discount',
  formula: '10% reduction applied only to the variable Final Value Fee component',
  conditions: 'Requires Top Rated Premium Service eligibility.',
};

/** eBay UK Business seller fees are published exclusive of VAT; 20% UK VAT is added on top. */
export const EBAY_FEES_ARE_EX_VAT = true;
