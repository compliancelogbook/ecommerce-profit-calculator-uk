import type { VerificationStatus } from '../data/types';

export type ConfidenceLevel = 'EXACT_FOR_SELECTED_INPUTS' | 'ASSUMPTION_DEPENDENT' | 'EXCLUDES_VARIABLE_FEES';

export type FeeCategory =
  | 'transaction'
  | 'processing'
  | 'listing'
  | 'regulatory'
  | 'international'
  | 'conversion'
  | 'advertising'
  | 'subscription'
  | 'other';

export interface FeeLine {
  id: string;
  label: string;
  /** Unrounded, ex-VAT amount in pounds. */
  amountExVat: number;
  category: FeeCategory;
  vatRate?: number;
  /** Unrounded VAT amount in pounds, when known. */
  vatAmount?: number;
  vatUnconfirmed?: boolean;
  sourceUrl?: string;
  verifiedAt?: string | null;
  verificationStatus?: VerificationStatus;
  notes?: string;
}

export interface CalculationResult {
  grossRevenue: number;
  cogs: number;
  shippingCost: number;

  platformTransactionFee: number;
  paymentProcessingFee: number;
  listingFee: number;
  regulatoryFee: number;
  internationalFee: number;
  currencyConversionFee: number;
  advertisingFee: number;
  allocatedSubscriptionCost: number;

  vatOnFees: number;
  potentiallyReclaimableVat: number;

  totalCashFees: number;
  estimatedEconomicFees: number;

  estimatedProfit: number;
  marginPct: number | null;
  roiPct: number | null;

  confidence: ConfidenceLevel;
  feeLines: FeeLine[];
  assumptions: string[];
  exclusions: string[];
}

/** margin = profit / revenue; roi = profit / total cost. Never NaN/Infinity. */
export function safeRatioPct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  const result = (numerator / denominator) * 100;
  return Number.isFinite(result) ? result : null;
}
