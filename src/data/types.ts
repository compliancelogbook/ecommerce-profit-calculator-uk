// Shared metadata shapes for platform fee configuration.
// Data files under src/data/*.fees.ts describe WHAT the fees are.
// src/lib/engines/*.ts describe HOW they are applied. Never mix the two.

export type Platform = 'SHOPIFY' | 'ETSY' | 'EBAY' | 'AMAZON' | 'TIKTOK';

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
  /** Stable internal identifier used throughout this app. */
  id: string;
  label: string;
  /** The platform's own official category ID, where confirmed by primary evidence (e.g. eBay category #281). */
  officialCategoryId?: string;
  /**
   * Present only when the variable fee rate itself has been confirmed for
   * this category. Absent (undefined) means the variable fee is NOT
   * auto-calculable here — manual entry is required — even though other
   * confirmed facts about the category (its official ID, a reduced
   * per-order fee, etc.) may still be known and used. This lets a category
   * be "structured but FVF-unconfirmed" rather than forcing an all-or-
   * nothing choice between full auto-calculation and total exclusion.
   */
  schedule?: PercentageSchedule;
  /**
   * For TIERED/THRESHOLD_FLAT schedules only: whether the threshold is
   * evaluated against a single item's price (PER_ITEM — each unit in a
   * multi-quantity order is tiered independently, then multiplied by
   * quantity) or against the combined order total (PER_ORDER). Confirmed
   * per category from primary evidence — never inferred. Irrelevant for
   * FLAT schedules (mathematically identical either way). Undefined means
   * PER_ORDER (the historical default, unchanged for categories where this
   * hasn't been separately confirmed).
   */
  tierBasis?: 'PER_ITEM' | 'PER_ORDER';
  /**
   * Confirmed per category from primary evidence: the FVF rate/threshold
   * for this category is based on the item's own selling price ONLY —
   * postage, other fees and taxes are never included, at any quantity
   * (e.g. eBay's Trainers subcategories: "7% if item selling price is
   * £100 or more... excludes postage"). This is a CONFIRMED rule, distinct
   * from the general per-item postage exclusion applied for quantity > 1
   * elsewhere (which is an unconfirmed-allocation limitation, not a
   * published rule) — a line using this flag is never marked incomplete.
   */
  thresholdExcludesPostage?: boolean;
  /** Minimum fee floor in pounds, applied after the percentage schedule. */
  minimumFee?: number;
  /** Overrides the platform-default per-order fee for this category, if the platform defines one. */
  perOrderFeeOverride?: number;
  /**
   * A confirmed, category-tied reduced per-order fee (e.g. eBay's 10p
   * instead of 30p for qualifying Collectables/Home categories). Eligibility
   * is derived ENTIRELY from the selected category matching one of these
   * rules — there is deliberately no free-standing user-assertable toggle.
   */
  reducedPerOrderFee?: { fee: number; atOrBelowThreshold: number; source: SourceRef };
  source: SourceRef;
}

/** A resolvable but not-yet-quantified category — forces explicit manual entry, never a silent guess. */
export const UNSUPPORTED_CATEGORY_ID = 'UNSUPPORTED_MANUAL_ENTRY';
