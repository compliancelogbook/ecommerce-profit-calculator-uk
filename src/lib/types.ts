import type { Platform, VerificationStatus } from '../data/types';

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

/**
 * A single, self-describing fee line. Deliberately carries full audit
 * metadata (platform, market, fee type, formula, currency, conditions,
 * effective date, verification) so a result is auditable by reading the
 * data it returns — not by reverse-engineering the engine that produced it.
 */
export interface FeeLine {
  id: string;
  label: string;
  /** Unrounded, ex-VAT amount in pounds. */
  amountExVat: number;
  category: FeeCategory;
  platform?: Platform;
  sellerMarket?: 'GB';
  /** Machine-readable fee type, e.g. 'referral_fee', 'regulatory_operating_fee'. */
  feeType?: string;
  /** Human-readable formula actually applied, e.g. "14.9% up to £1,000, then 4% above". */
  formula?: string;
  currency?: 'GBP' | 'USD';
  conditions?: string;
  effectiveDate?: string | null;
  vatRate?: number;
  /** Unrounded VAT amount in pounds, when known. */
  vatAmount?: number;
  vatUnconfirmed?: boolean;
  /**
   * True when `amountExVat` is already a VAT-inclusive cash figure (the
   * published rate itself includes VAT, e.g. TikTok Shop's commission) —
   * distinct from `vatAmount`/`vatRate`, which describe VAT added
   * separately ON TOP of an ex-VAT figure. A line should set at most one of
   * "vatInclusive" or "vatAmount/vatRate", never both.
   */
  vatInclusive?: boolean;
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
  /**
   * Lump-sum, user-entered actual costs that have no published fee schedule
   * to calculate from (e.g. TikTok Shop fulfilment/FBT, ads spend, storage,
   * returns) — entered as-is, never estimated. Zero for every engine that
   * doesn't collect one.
   */
  otherPlatformCosts: number;

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

  /**
   * Vinted-only: an indicative typical Buyer Protection range, paid BY THE
   * BUYER — never a seller fee. Purely contextual information for display;
   * deliberately NOT a fee line, and never included in any total above
   * (totalCashFees, estimatedEconomicFees, estimatedProfit, marginPct,
   * roiPct all exclude it by construction — see buildResult in
   * src/lib/engines/shared.ts). Undefined for every other platform.
   */
  buyerProtectionRange?: { low: number; high: number; note: string } | null;
}

/** margin = profit / revenue; roi = profit / total cost. Never NaN/Infinity. */
export function safeRatioPct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  const result = (numerator / denominator) * 100;
  return Number.isFinite(result) ? result : null;
}
