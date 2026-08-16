import type { SourceRef } from './types';

export const ETSY_SOURCES = {
  feesAndTaxes: {
    url: 'https://help.etsy.com/hc/en-gb/articles/115014483627-What-are-the-Fees-and-Taxes-for-Selling-on-Etsy',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
  paymentProcessing: {
    url: 'https://help.etsy.com/hc/en-gb/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
  regulatoryOperatingFee: {
    url: 'https://help.etsy.com/hc/en-gb/articles/1500011073202-What-is-a-Regulatory-Operating-Fee',
    verifiedAt: '2026-08-16',
    verificationStatus: 'SPEC_VERIFIED',
  } satisfies SourceRef,
};

/**
 * VAT-on-fees treatment per fee type. `VAT_ID_BASED` means: 20% VAT charged by
 * Etsy when no VAT ID is on file, 0% (reverse charge) when one is supplied —
 * this is confirmed by Etsy's own Fees & Taxes / Payment Processing pages for
 * these specific fee types. `UNCONFIRMED` fee types are shown ex-VAT with an
 * explicit disclosure rather than an inferred rate, per the brief's
 * "never guess" requirement — Etsy's Regulatory Operating Fee page, the
 * Offsite Ads terms, and currency-conversion terms were not independently
 * fetchable to confirm whether the same mechanism applies to them.
 */
export type EtsyFeeVatTreatment = 'VAT_ID_BASED' | 'UNCONFIRMED';

export const ETSY_LISTING_FEE_USD = 0.2;
export const ETSY_LISTING_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_TRANSACTION_FEE_RATE = 0.065;
export const ETSY_TRANSACTION_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_PAYMENTS_FEE = { rate: 0.04, fixed: 0.2 };
export const ETSY_PAYMENTS_FEE_VAT: EtsyFeeVatTreatment = 'VAT_ID_BASED';

export const ETSY_REGULATORY_FEE_RATE = 0.0048;
export const ETSY_REGULATORY_FEE_VAT: EtsyFeeVatTreatment = 'UNCONFIRMED';

export const ETSY_CURRENCY_CONVERSION_RATE = 0.025;
export const ETSY_CURRENCY_CONVERSION_VAT: EtsyFeeVatTreatment = 'UNCONFIRMED';

export type EtsyOffsiteAdsRate = 0.15 | 0.12;
export const ETSY_OFFSITE_ADS_VAT: EtsyFeeVatTreatment = 'UNCONFIRMED';
/** Cap on the Offsite Ads fee, per order, in USD — converted using the same
 *  user-facing USD→GBP assumption used for the listing fee. */
export const ETSY_OFFSITE_ADS_CAP_USD = 100;

/** Default USD→GBP assumption. This is a user-editable calculation input, not
 *  a hidden constant — exposed in the UI and in every result as an assumption. */
export const DEFAULT_USD_TO_GBP_RATE = 0.75;
