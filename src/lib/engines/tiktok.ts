import { TIKTOK_CATEGORIES } from '../../data/tiktok.fees';
import { TIKTOK_AFFILIATE_VAT_SOURCE } from '../../data/tiktok.sources';
import { UNSUPPORTED_CATEGORY_ID, type SourceRef } from '../../data/types';
import type { VatProfile } from '../../data/vat';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { formatPercent } from '../format';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { assertNonNegative, assertValidQuantity, buildResult, makeFeeLine } from './shared';

export interface TikTokInput {
  soldPrice: number;
  itemCost: number;
  /** Shipping charged to the customer (order total) — part of the commission basis, per TikTok's published formula. */
  customerPaidShipping: number;
  /** The seller's own actual shipping/fulfilment cost (order total) — kept separate from customerPaidShipping and never part of the commission basis. */
  shippingCost: number;
  quantity: number;
  /** Seller-funded discount (order total, £) — reduces the commission basis. */
  sellerDiscount: number;
  /**
   * TikTok-funded (platform) discount (order total, £). Does NOT reduce the
   * platform commission basis (TikTok absorbs that cost itself), but DOES
   * reduce the affiliate/creator commission basis — the two commissions use
   * different official formulas, not one shared basis.
   */
  platformDiscount: number;
  categoryId: string;
  /** Required when categoryId === UNSUPPORTED_CATEGORY_ID (fraction, e.g. 0.09 = 9%). Must be a valid, >0 number; 0/negative/absent are all treated as "not supplied". */
  manualCategoryRate?: number | null;
  /**
   * Optional seller-specific promotional commission rate, clearly a manual
   * override. `null`/`undefined` means "not supplied" (use the category
   * rate). Any OTHER value must be valid (>0%, <=100%) — a supplied-but-
   * invalid value is a caller bug and throws, rather than silently falling
   * back to the category rate (see resolveTikTok, which is what enforces
   * this from the UI before the engine is ever called). When valid, it
   * REPLACES the category/manual rate entirely — never stacked/summed.
   */
  promotionalRate?: number | null;
  /**
   * Optional, user-entered affiliate/creator commission rate (fraction,
   * e.g. 0.1 = 10%). `null`/`undefined`/exactly `0` all mean "no affiliate
   * arrangement applies" — never assumed. Any OTHER value must fall within
   * TikTok's documented 1%-80% range; a supplied-but-invalid value is a
   * caller bug and throws, rather than silently being treated as "not
   * supplied" (see resolveTikTok for the UI-layer enforcement). Applied to
   * its own basis (product price minus seller and platform discount,
   * excluding shipping) — separate from, and never combined with, the
   * platform commission basis.
   */
  affiliateCommissionRate?: number | null;
  /**
   * Lump-sum actual costs for TikTok Shop fulfilment/FBT, ads, storage and
   * returns — the TOTAL cash amount actually charged, INCLUDING any VAT
   * the seller was charged on it. TikTok does not publish a fee schedule
   * for these that this build's verified dataset covers, so no schedule is
   * invented or generalised; this is a direct actual-cost entry, the same
   * pattern the app already uses for "Actual Shipping Cost" — always
   * ASSUMPTION_DEPENDENT at minimum, never treated as an automatically
   * verified marketplace fee.
   */
  otherActualCosts: number;
  vatProfile: VatProfile;
}

function isValidRate(rate: number | null | undefined): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 && rate <= 1;
}

/** TikTok's currently documented affiliate/creator commission range is 1%-80%. Blank/0 means "no affiliate arrangement". */
function isValidAffiliateRate(rate: number | null | undefined): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate >= 0.01 && rate <= 0.8;
}

export function calculateTikTok(input: TikTokInput): CalculationResult {
  assertNonNegative('sold price', input.soldPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('customer-paid shipping', input.customerPaidShipping);
  assertNonNegative('shipping cost', input.shippingCost);
  assertNonNegative('seller discount', input.sellerDiscount);
  assertNonNegative('platform discount', input.platformDiscount);
  assertNonNegative('other actual costs', input.otherActualCosts);
  assertValidQuantity(input.quantity);

  const qty = input.quantity;
  const itemSubtotal = money(input.soldPrice).times(qty);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  // A combined seller + platform discount that exceeds the product subtotal
  // describes an order that could not actually have happened — reject it
  // outright (a caller bug) rather than floor or silently normalise it into
  // a plausible-looking but fictitious result. The UI layer (resolveTikTok)
  // blocks this before ever calling the engine; this is the defense-in-
  // depth backstop, matching assertNonNegative's philosophy above.
  const combinedDiscount = money(input.sellerDiscount).plus(input.platformDiscount);
  if (combinedDiscount.gt(itemSubtotal)) {
    throw new Error(
      `Invalid discounts: seller discount (£${input.sellerDiscount.toFixed(2)}) plus platform discount (£${input.platformDiscount.toFixed(2)}) = £${toRawNumber(combinedDiscount).toFixed(2)}, which exceeds the product subtotal (£${toRawNumber(itemSubtotal).toFixed(2)} = original product price × quantity).`
    );
  }

  // TikTok's published PLATFORM commission formula: the basis is the item
  // subtotal, less any SELLER-funded discount, plus shipping charged to the
  // customer. A TikTok-funded (platform) discount does not reduce this
  // basis — TikTok absorbs that cost itself, it is not deducted from what
  // the seller is deemed to have sold for. Worked example: £100 product,
  // £10 seller discount, £10 platform discount, £5 customer-paid shipping
  // -> basis = 100 - 10 + 5 = £95 (the £10 platform discount does not
  // appear in THIS basis at all).
  const commissionBasis = itemSubtotal.minus(input.sellerDiscount).plus(input.customerPaidShipping);
  const grossRevenue = commissionBasis;

  // TikTok's published AFFILIATE/CREATOR commission formula uses a
  // DIFFERENT basis from the platform commission — see
  // https://seller-uk.tiktok.com/university/essay?knowledge_id=7753826522154754:
  // affiliateBasis = product price - seller discount - platform discount.
  // Unlike the platform basis, this one EXCLUDES customer-paid shipping and
  // SUBTRACTS the platform discount rather than ignoring it. Guaranteed
  // non-negative by the combined-discount guard above — no flooring needed.
  // Same worked example: 100 - 10 - 10 = £80.
  const affiliateBasis = itemSubtotal.minus(input.sellerDiscount).minus(input.platformDiscount);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [];
  const signals: ConfidenceLevel[] = [];

  // --- Platform commission: standard/category rate OR promotional override — never both. ---
  // `promotionalRate` distinguishes "not supplied" (null/undefined -> use
  // the category rate) from "supplied but invalid" (a caller bug — throw
  // rather than silently falling back to the category schedule, which
  // would otherwise produce an apparently-exact result computed from a
  // rate the caller never actually confirmed).
  if (input.promotionalRate !== null && input.promotionalRate !== undefined && !isValidRate(input.promotionalRate)) {
    throw new Error(`Invalid promotional rate: must be a number greater than 0% and at most 100%, got ${input.promotionalRate}.`);
  }

  let commissionRate: number | null = null;
  let commissionLabel = '';
  let commissionFormula = '';
  let commissionSource: SourceRef | undefined;
  let commissionIsPromotional = false;

  if (isValidRate(input.promotionalRate)) {
    commissionRate = input.promotionalRate;
    commissionIsPromotional = true;
    commissionLabel = 'Platform commission (seller-specific promotional rate — manual override)';
    commissionFormula = `${formatPercent(commissionRate)} promotional override on £${toRawNumber(commissionBasis).toFixed(2)} (replaces the category rate; not stacked with it)`;
    assumptions.push(
      `A seller-specific promotional commission rate of ${formatPercent(commissionRate)} was entered — this replaces the category rate entirely; it is never added on top of it.`
    );
    signals.push('ASSUMPTION_DEPENDENT');
  } else {
    const category = TIKTOK_CATEGORIES.find((c) => c.id === input.categoryId);
    if (category) {
      commissionRate = category.rate;
      const subLabel = category.subcategoryDisplay ?? category.subcategory;
      commissionLabel = `Platform commission — ${category.category}${subLabel !== 'All' ? ` > ${subLabel}` : ''}`;
      commissionFormula = `${formatPercent(commissionRate)} on £${toRawNumber(commissionBasis).toFixed(2)}, inclusive of applicable VAT`;
      commissionSource = category.source;
    } else if (input.categoryId === UNSUPPORTED_CATEGORY_ID && isValidRate(input.manualCategoryRate)) {
      commissionRate = input.manualCategoryRate;
      commissionLabel = 'Platform commission — manually entered rate';
      commissionFormula = `${formatPercent(commissionRate)} on £${toRawNumber(commissionBasis).toFixed(2)} (manually entered)`;
      assumptions.push(
        `Category not in the verified 343-row commission schedule — commission calculated using a manually entered rate of ${formatPercent(commissionRate)}.`
      );
      signals.push('ASSUMPTION_DEPENDENT');
    }
  }

  let commission = ZERO;
  if (commissionRate !== null) {
    commission = percentOf(commissionBasis, commissionRate);
    feeLines.push(
      makeFeeLine({
        id: 'tiktok-commission',
        label: commissionLabel,
        amount: commission,
        category: 'transaction',
        platform: 'TIKTOK',
        feeType: 'commission',
        formula: commissionFormula,
        source: commissionSource,
        // The published rate is VAT-inclusive cash — not an ex-VAT figure
        // with VAT added on top, so vatRate/vatAmount are never set here;
        // vatInclusive communicates that distinction to the UI instead.
        vatInclusive: true,
        notes:
          "TikTok Shop's published commission rate is inclusive of applicable VAT — no separate 20% UK VAT is added on top of it. The embedded VAT component is not separated out or estimated by this calculator.",
      })
    );
    if (input.vatProfile === 'REGISTERED') {
      // A promotional/manually-entered rate already carries its own
      // ASSUMPTION_DEPENDENT signal above; this VAT-registered disclosure
      // applies independently of that, to a confirmed category rate too.
      const rateDescription = commissionIsPromotional ? 'platform commission (promotional rate)' : 'platform commission';
      exclusions.push(
        `TikTok Shop's ${rateDescription} is a VAT-inclusive cash figure — the full published amount is the correct cash deduction either way. As a VAT-registered seller, the VAT embedded within it is not separated out or estimated here; use TikTok's Platform Service Fee invoice to determine any amount you can reclaim.`
      );
      signals.push('EXCLUDES_VARIABLE_FEES');
    }
  } else {
    exclusions.push(
      'Selected category is not in the verified TikTok Shop UK commission schedule and no manual rate was supplied — commission excluded rather than guessed.'
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  // --- Affiliate/creator commission: separate deduction, own basis, optional, never assumed. ---
  // `affiliateCommissionRate` distinguishes "not applicable" (null/
  // undefined/exactly 0) from "supplied but invalid" (a caller bug — throw
  // rather than silently treating it as "not applicable", which would
  // otherwise omit a real affiliate cost from an apparently-complete result).
  if (
    input.affiliateCommissionRate !== null &&
    input.affiliateCommissionRate !== undefined &&
    input.affiliateCommissionRate !== 0 &&
    !isValidAffiliateRate(input.affiliateCommissionRate)
  ) {
    throw new Error(
      `Invalid affiliate commission rate: must be between 1% and 80% (TikTok's documented range), or 0/omitted for "not applicable", got ${input.affiliateCommissionRate}.`
    );
  }

  let affiliateCommission = ZERO;
  if (isValidAffiliateRate(input.affiliateCommissionRate)) {
    affiliateCommission = percentOf(affiliateBasis, input.affiliateCommissionRate);
    feeLines.push(
      makeFeeLine({
        id: 'tiktok-affiliate-commission',
        label: 'Affiliate/creator commission (user-entered rate)',
        amount: affiliateCommission,
        category: 'advertising',
        platform: 'TIKTOK',
        feeType: 'affiliate_commission',
        formula: `${formatPercent(input.affiliateCommissionRate)} on £${toRawNumber(affiliateBasis).toFixed(2)} (£${toRawNumber(itemSubtotal).toFixed(2)} product price - £${input.sellerDiscount.toFixed(2)} seller discount - £${input.platformDiscount.toFixed(2)} platform discount — excludes customer-paid shipping; a separate basis from the platform commission)`,
        source: TIKTOK_AFFILIATE_VAT_SOURCE,
        vatUnconfirmed: true,
        notes:
          "User-entered affiliate/creator program rate — never assumed when not supplied. VAT treatment depends on the creator's own VAT status and invoicing.",
      })
    );
    exclusions.push(
      "Affiliate/creator commission VAT treatment is not fully known — it depends on the individual creator and whether they issue a VAT invoice. A VAT-registered creator must issue an invoice, and VAT may apply on it; this is not modelled or estimated here. Confirm the actual treatment via the creator's invoice."
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  // --- Other actual TikTok Shop costs: fulfilment/FBT, ads, storage, returns — actual entry, no invented schedule. ---
  const otherActualCosts = money(input.otherActualCosts);
  if (otherActualCosts.gt(0)) {
    feeLines.push(
      makeFeeLine({
        id: 'tiktok-other-actual-costs',
        label: 'Other TikTok Shop costs (fulfilment/FBT, ads, storage, returns — actual, user-entered)',
        amount: otherActualCosts,
        category: 'other',
        platform: 'TIKTOK',
        feeType: 'other_actual_cost',
        formula: 'User-entered actual amount — not a calculated schedule',
        vatUnconfirmed: true,
        notes:
          "Entered as the total cash amount actually charged, including any VAT you were charged on it — not derived from a published fee schedule. TikTok's FBT/ads/storage/return fee schedules are variable and were not part of the verified dataset for this build.",
      })
    );
    assumptions.push(
      "Other TikTok Shop costs are a user-entered actual cash amount (including any VAT charged on it), not an automatically verified marketplace fee schedule."
    );
    signals.push('ASSUMPTION_DEPENDENT');
    if (input.vatProfile === 'REGISTERED') {
      assumptions.push(
        'You are VAT-registered: any potential VAT recovery on the entered "other TikTok Shop costs" amount is not modelled — confirm your own reclaimable VAT position with your accountant.'
      );
    }
  }

  if (input.platformDiscount > 0) {
    assumptions.push(
      `A £${input.platformDiscount.toFixed(2)} TikTok-funded (platform) discount was recorded for this order. It does not reduce the platform commission basis (TikTok absorbs that cost itself), but it does reduce the affiliate/creator commission basis when an affiliate rate is supplied — the two commissions follow different official formulas.`
    );
  }

  // Never derive a reclaimable VAT amount for TikTok — no vatOnFees /
  // potentiallyReclaimableVat is calculated for any TikTok fee line, ever.
  // The published commission is VAT-inclusive cash (see TIKTOK_COMMISSION_VAT_SOURCE
  // and the exclusion above for VAT-registered sellers); deriving a
  // reclaimable figure without the seller's actual Platform Service Fee
  // invoice would be exactly the kind of guess this app refuses to make.
  return buildResult({
    grossRevenue,
    cogs,
    shippingCost,
    platformTransactionFee: commission,
    advertisingFee: affiliateCommission,
    otherPlatformCosts: otherActualCosts,
    feeLines,
    assumptions,
    exclusions,
    confidence: worstConfidence(signals),
  });
}
