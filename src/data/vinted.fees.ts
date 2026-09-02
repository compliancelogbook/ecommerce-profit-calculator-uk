import type { SourceRef } from './types';

// Vinted UK seller/buyer fee data — every figure here was fetched live and
// individually checked on 2026-09-02 (see /methodology for the full
// verification record and the documented Buyer Protection conflict below).

/**
 * Vinted's "How it works" marketing page confirms listing is free and
 * "There are zero selling fees, so what you earn is yours to keep." — the
 * mandatory seller platform fee (listing/transaction/selling) is £0.
 */
export const VINTED_ZERO_SELLING_FEE_SOURCE: SourceRef = {
  platform: 'VINTED',
  sellerMarket: 'GB',
  feeType: 'seller_platform_fee',
  formula: '£0 — no mandatory listing, transaction or selling fee charged to sellers',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.vinted.co.uk/how_it_works',
  verifiedAt: '2026-09-02',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Vinted UK\'s "How it works" page states: "There are zero selling fees, so what you earn is yours to keep." Listing is also confirmed free.',
};

/**
 * The SAME "How it works" page states Buyer Protection as a simplified flat
 * "5% + £0.70". This is deliberately NOT used to calculate the fee — see
 * VINTED_BUYER_PROTECTION_DETAILED_SOURCE and the conflict note below.
 */
export const VINTED_BUYER_PROTECTION_MARKETING_SOURCE: SourceRef = {
  platform: 'VINTED',
  sellerMarket: 'GB',
  feeType: 'buyer_protection_fee_marketing_summary',
  formula: '5% of the item price + £0.70 (simplified marketing-page figure)',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.vinted.co.uk/how_it_works',
  verifiedAt: '2026-09-02',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'A simplified headline figure on the general marketing page. This build deliberately does NOT hard-code this as the exact Buyer Protection fee — Vinted\'s own more specific Price List and Buyer Protection help page (see VINTED_BUYER_PROTECTION_DETAILED_SOURCE) describe a variable calculation that takes precedence for calculator modelling. Documented in full on /methodology.',
};

/**
 * Vinted's dedicated Buyer Protection help page and Price List both describe
 * a VARIABLE fee — this is the source of truth for calculator modelling,
 * taking precedence over the simplified "5% + £0.70" marketing figure above.
 */
export const VINTED_BUYER_PROTECTION_DETAILED_SOURCE: SourceRef = {
  platform: 'VINTED',
  sellerMarket: 'GB',
  feeType: 'buyer_protection_fee',
  formula:
    'Variable — depends on item characteristics, order value, and single-item vs bundle order type. Typically a percentage of the item/bundle price plus a fixed fee, usually 3%-8% + £0.30-£0.80. Paid by the buyer, VAT-inclusive, added automatically and shown at checkout.',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.vinted.co.uk/help/342-buyer-protection-fee-on-vinted',
  verifiedAt: '2026-09-02',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Confirms: "varies based on several factors, such as: item characteristics, order value, order type (a single item versus a bundle)" and "typically includes a percentage of the item\'s or bundle\'s price, as well as a fixed fee — usually 3% to 8% + £0.3 to £0.8." Also confirms VAT is included and the fee is mandatory for every "Buy now" order, paid by the buyer.',
};

/**
 * Vinted's Price List confirms Bump and Showcase are optional, seller-paid
 * visibility services with no universal fixed price — the exact cost is
 * shown at checkout and varies by duration/item price.
 */
export const VINTED_PRICELIST_SOURCE: SourceRef = {
  platform: 'VINTED',
  sellerMarket: 'GB',
  feeType: 'bump_showcase_pricing',
  formula: 'Optional, seller-paid; no universal fixed price — the applicable fee is shown to the seller at checkout',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.vinted.co.uk/pricelist',
  verifiedAt: '2026-09-02',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Confirms: "The Fee for Bumping Listed Items will vary depending on the chosen duration and item price" and, for Showcase, "The applicable fee and Showcase duration will be shown to you at checkout." No fixed amount is invented here — the user enters the actual amount they paid.',
};

/**
 * Vinted's Pro guide: professional sellers must register as a Pro Seller,
 * can list for free (same £0 mandatory-fee position as private sellers),
 * but the listing price must include applicable VAT/taxes, and the
 * second-hand VAT margin scheme may apply.
 */
export const VINTED_PRO_GUIDE_SOURCE: SourceRef = {
  platform: 'VINTED',
  sellerMarket: 'GB',
  feeType: 'pro_seller_requirements',
  formula: 'Pro registration required; listing free; listing price must include applicable VAT/taxes',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.vinted.co.uk/pro-guide',
  verifiedAt: '2026-09-02',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Confirms: "If you are a professional, you must declare yourself as a \'Pro Seller\' on Vinted", "You can list as many items as you want, for free", "The listing price must include all related taxes, this includes the VAT amount as well", and that "a special VAT margin scheme could be applied for second-hand items".',
};

/**
 * HMRC's own guidance on the second-hand goods VAT margin scheme Vinted's
 * Pro guide links out to — cited so the margin-scheme exclusion isn't a bare
 * assertion. Statutory, not a Vinted-published figure.
 */
export const HMRC_VAT_MARGIN_SCHEME_SOURCE: SourceRef = {
  sellerMarket: 'GB',
  feeType: 'vat_margin_scheme',
  formula: 'Optional scheme: VAT accounted for on the margin (selling price minus purchase price), not the full selling price, for eligible second-hand goods',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.gov.uk/guidance/the-margin-and-global-accounting-scheme-vat-notice-718',
  verifiedAt: null,
  verificationStatus: 'STATUTORY',
  notes: 'HMRC VAT Notice 718 — statutory guidance, not a Vinted-published fee.',
};

/** Mandatory Vinted seller platform (listing/transaction/selling) fee — always £0. */
export const VINTED_MANDATORY_SELLER_FEE = 0;

/**
 * The indicative typical Buyer Protection range this build is permitted to
 * display, per the resolved source conflict: lower indication 3% + £0.30,
 * upper indication 8% + £0.80, taken directly from
 * VINTED_BUYER_PROTECTION_DETAILED_SOURCE's published "usually 3% to 8% +
 * £0.3 to £0.8" range. Never the exact fee — Vinted alone determines and
 * displays that at checkout.
 */
export const VINTED_BUYER_PROTECTION_RANGE = {
  lowPct: 0.03,
  lowFixed: 0.3,
  highPct: 0.08,
  highFixed: 0.8,
} as const;
