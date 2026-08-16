import type { SourceRef } from './types';

const ETSY_META = { platform: 'ETSY', sellerMarket: 'GB' } as const;

export const ETSY_SOURCES = {
  feesAndTaxes: {
    ...ETSY_META,
    currency: 'GBP',
    effectiveDate: null,
    url: 'https://help.etsy.com/hc/en-gb/articles/115014483627-What-are-the-Fees-and-Taxes-for-Selling-on-Etsy',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
  paymentProcessing: {
    ...ETSY_META,
    currency: 'GBP',
    effectiveDate: null,
    url: 'https://help.etsy.com/hc/en-gb/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
  regulatoryOperatingFee: {
    ...ETSY_META,
    currency: 'GBP',
    effectiveDate: null,
    url: 'https://help.etsy.com/hc/en-gb/articles/1500011073202-What-is-a-Regulatory-Operating-Fee',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
};

/** Currency conversion fee (2.5%) is listed on Etsy's general Fees & Taxes page (given directly in the original build brief). */
export const ETSY_CURRENCY_CONVERSION_SOURCE: SourceRef = {
  ...ETSY_META,
  feeType: 'currency_conversion_fee',
  formula: '2.5% of the relevant conversion basis',
  currency: 'GBP',
  conditions: 'Applies only when Etsy performs currency conversion on the order.',
  effectiveDate: null,
  url: ETSY_SOURCES.feesAndTaxes.url,
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

/**
 * Offsite Ads rates (15%/12%) were given directly in the original build brief.
 * The US$100/order cap was confirmed during the 2026-08-16 launch audit
 * (not independently re-fetched by this build from Etsy's Offsite Ads terms) —
 * tagged AUDIT_VERIFIED rather than SPEC_VERIFIED to distinguish that.
 */
export const ETSY_OFFSITE_ADS_SOURCE: SourceRef = {
  ...ETSY_META,
  feeType: 'advertising_fee',
  formula: '15% (or 12% for eligible shops) of the order total, capped at US$100/order',
  currency: 'GBP',
  conditions: 'Optional, only applied when Offsite Ads is selected for the order.',
  effectiveDate: null,
  url: ETSY_SOURCES.feesAndTaxes.url,
  verifiedAt: '2026-08-16',
  verificationStatus: 'AUDIT_VERIFIED',
  notes: 'US$100/order cap confirmed during the 2026-08-16 launch audit; not independently re-fetched by this build.',
};

/**
 * VAT-on-fees treatment per fee type. `VAT_ID_BASED` means: 20% VAT charged by
 * Etsy when no VAT ID is on file, 0% (reverse charge) when one is supplied.
 * `UNCONFIRMED` fee types are shown ex-VAT with an explicit disclosure rather
 * than an inferred rate, per the brief's "never guess" requirement.
 */
export type EtsyFeeVatTreatment = 'VAT_ID_BASED' | 'UNCONFIRMED';

export const ETSY_LISTING_FEE_USD = 0.2;
export const ETSY_LISTING_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_TRANSACTION_FEE_RATE = 0.065;
export const ETSY_TRANSACTION_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_PAYMENTS_FEE = { rate: 0.04, fixed: 0.2 };
export const ETSY_PAYMENTS_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_REGULATORY_FEE_RATE = 0.0048;
/**
 * Corrected 2026-08-16: Etsy's Regulatory Operating Fee help page explicitly
 * states the fee is subject to VAT where applicable, following the same
 * VAT-ID-based mechanism as Etsy's other seller fees. Previously modelled as
 * UNCONFIRMED — that was overly conservative given the primary source
 * directly addresses it.
 */
export const ETSY_REGULATORY_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_CURRENCY_CONVERSION_RATE = 0.025;
/** Etsy's currency-conversion fee VAT treatment is not separately confirmed by a primary source — shown ex-VAT, disclosed. */
export const ETSY_CURRENCY_CONVERSION_VAT: EtsyFeeVatTreatment = 'UNCONFIRMED';

export type EtsyOffsiteAdsRate = 0.15 | 0.12;
/** Offsite Ads fee VAT treatment is not separately confirmed by a primary source — shown ex-VAT, disclosed. */
export const ETSY_OFFSITE_ADS_VAT: EtsyFeeVatTreatment = 'UNCONFIRMED';
/** Cap on the Offsite Ads fee, per order, in USD — converted using the same
 *  user-facing USD→GBP assumption used for the listing fee. */
export const ETSY_OFFSITE_ADS_CAP_USD = 100;

/** Default USD→GBP assumption. This is a user-editable calculation input, not
 *  a hidden constant — exposed in the UI and in every result as an assumption. */
export const DEFAULT_USD_TO_GBP_RATE = 0.75;
