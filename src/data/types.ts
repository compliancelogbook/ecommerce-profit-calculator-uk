// Shared metadata shapes for platform fee configuration.
// Data files under src/data/*.fees.ts describe WHAT the fees are.
// src/lib/engines/*.ts describe HOW they are applied. Never mix the two.

export type Platform = 'SHOPIFY' | 'ETSY' | 'EBAY' | 'AMAZON';

export type VerificationStatus =
  // Number is taken verbatim from the brief this dataset was built against,
  // and is exercised by an automated acceptance test.
  | 'SPEC_VERIFIED'
  // Individually confirmed against primary evidence during a specific,
  // dated audit/correction pass (distinct from the original build brief).
  // Used e.g. for the 2026-08-16 launch-audit corrections.
  | 'AUDIT_VERIFIED'
  // Number was pulled from a live fetch of the official source page but has
  // not been independently cross-checked line-by-line.
  | 'AUTOMATED_UNVERIFIED'
  // Statutory/legal fact (e.g. standard UK VAT rate) rather than a
  // marketplace-specific published fee.
  | 'STATUTORY';

/**
 * Full audit-grade metadata for a fee rule. Every field the specification
 * requires a fee rule to support: platform, seller market, fee type,
 * percentage/fixed/formula, currency, conditions, effective date, verified
 * date, official source URL, verification status, notes. `platform` is
 * omitted for cross-platform statutory facts (e.g. the UK VAT rate).
 */
export interface SourceRef {
  platform?: Platform;
  sellerMarket?: 'GB';
  /** Machine-readable fee type, e.g. 'referral_fee', 'regulatory_operating_fee'. */
  feeType?: string;
  /** Human-readable formula, e.g. "14.9% up to £1,000, then 4% on the portion above". */
  formula?: string;
  currency?: 'GBP' | 'USD';
  /** Any conditions under which this rule applies (plan, processor, region, etc.). */
  conditions?: string;
  /** ISO date the rate took effect, where publicly stated. Null if not separately known. */
  effectiveDate?: string | null;
  url: string;
  /** ISO date the figure was last confirmed against the source, e.g. '2026-08-16'. */
  verifiedAt: string | null;
  verificationStatus: VerificationStatus;
  notes?: string;
}

/** A single band in a tiered ("up to £X at rate A, then rate B above") fee schedule. */
export interface FeeTier {
  /** Upper bound of this tier, inclusive, in pounds. `null` = unbounded (final tier). */
  upTo: number | null;
  /** Decimal rate, e.g. 0.149 for 14.9%. */
  rate: number;
}

export type PercentageSchedule =
  | { kind: 'FLAT'; rate: number }
  // Marginal/portion-based: rate A applies to the portion up to the threshold,
  // rate B to the portion above it (e.g. eBay FVF, Amazon Jewellery/Watches).
  | { kind: 'TIERED'; tiers: FeeTier[] }
  // Whole-amount threshold: the ENTIRE basis is charged at whichever
  // bracket's rate it falls into — no blending (e.g. Amazon Home/Beauty,
  // confirmed by acceptance tests where a £30 item in an "8% up to £20 /
  // 15% above" category is charged flat 15% on the full £30, not a blend).
  | { kind: 'THRESHOLD_FLAT'; tiers: FeeTier[] };

export interface CategoryFeeRule {
  /** Stable identifier, ideally matching the platform's own category id where known. */
  id: string;
  label: string;
  schedule: PercentageSchedule;
  /** Minimum fee floor in pounds, applied after the percentage schedule. */
  minimumFee?: number;
  /** Overrides the platform-default per-order fee for this category, if the platform defines one. */
  perOrderFeeOverride?: number;
  source: SourceRef;
}

/** A resolvable but not-yet-quantified category — forces explicit manual entry, never a silent guess. */
export const UNSUPPORTED_CATEGORY_ID = 'UNSUPPORTED_MANUAL_ENTRY';
