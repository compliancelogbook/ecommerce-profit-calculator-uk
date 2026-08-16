import type { SourceRef } from './types';

/**
 * Standard UK VAT rate. This is a statutory rate (HMRC), not a marketplace fee —
 * it does not carry a marketplace verification date, and platforms can still
 * choose not to charge it (e.g. reverse charge when a valid VAT number is held).
 */
export const UK_STANDARD_VAT_RATE = 0.2;

export const UK_VAT_SOURCE: SourceRef = {
  sellerMarket: 'GB',
  feeType: 'vat_rate',
  formula: '20% standard rate',
  currency: 'GBP',
  effectiveDate: null,
  url: 'https://www.gov.uk/vat-rates',
  verifiedAt: null,
  verificationStatus: 'STATUTORY',
  notes: 'Standard UK VAT rate set by HMRC, not a marketplace-published figure.',
};

export type VatProfile = 'NOT_REGISTERED' | 'REGISTERED';
