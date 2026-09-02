import { VINTED_BUYER_PROTECTION_RANGE, VINTED_ZERO_SELLING_FEE_SOURCE } from '../../data/vinted.fees';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { assertNonNegative, assertValidQuantity, buildResult, makeFeeLine } from './shared';

export type VintedSellerRoute = 'PRIVATE' | 'PRO';

export interface VintedInput {
  /** Item selling price, per unit. */
  soldPrice: number;
  itemCost: number;
  quantity: number;
  /**
   * Shipping amount actually RECEIVED by the seller (order total). With
   * Vinted's normal prepaid-label flow the buyer purchases shipping
   * directly through Vinted and the seller receives nothing for it — this
   * should normally be left at £0. Only enter a real amount if the seller
   * genuinely received one; never assumed or calculated.
   */
  shippingReceived: number;
  /**
   * Shipping actually PAID by the seller themselves (order total). Also
   * normally £0 for the same reason. Kept strictly separate from
   * `shippingReceived` — one is revenue, the other is a cost.
   */
  shippingCost: number;
  sellerRoute: VintedSellerRoute;
  /**
   * The actual, VAT-inclusive amount paid or allocated to this sale for an
   * optional Bump/Showcase visibility service. `null`/`undefined` means no
   * such service was purchased for this sale — never assumed. When
   * supplied, must be a positive finite number (see resolveVinted for the
   * user-facing validation that enforces this before the engine is ever
   * called); the engine itself throws on an invalid supplied value as a
   * defense-in-depth boundary check, matching every other engine's pattern.
   */
  visibilityServiceCost?: number | null;
}

function assertValidVisibilityCost(cost: number | null | undefined): void {
  if (cost === null || cost === undefined) return;
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new Error(`Invalid visibility service cost: must be a positive finite number when supplied, got ${cost}.`);
  }
}

export function calculateVinted(input: VintedInput): CalculationResult {
  assertNonNegative('sold price', input.soldPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('shipping amount received', input.shippingReceived);
  assertNonNegative('actual shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);
  assertValidVisibilityCost(input.visibilityServiceCost);

  const qty = input.quantity;
  const itemSubtotal = money(input.soldPrice).times(qty);
  const cogs = money(input.itemCost).times(qty);
  const shippingReceived = money(input.shippingReceived);
  const shippingCost = money(input.shippingCost);

  // Seller gross revenue = item selling price x quantity + shipping amount
  // actually received by the seller. Buyer Protection is never part of
  // this — it is a fee the BUYER pays Vinted, not seller revenue.
  const grossRevenue = itemSubtotal.plus(shippingReceived);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [];
  const signals: ConfidenceLevel[] = [];

  // The mandatory Vinted seller platform fee is always £0 — shown as a real,
  // sourced fee line (not silently omitted) so the "£0" claim itself is
  // auditable rather than an invisible non-event.
  feeLines.push(
    makeFeeLine({
      id: 'vinted-seller-platform-fee',
      label: 'Vinted seller platform fee (listing / transaction / selling)',
      amount: ZERO,
      category: 'transaction',
      platform: 'VINTED',
      feeType: 'seller_platform_fee',
      formula: '£0 — Vinted charges sellers no mandatory listing, transaction or selling fee',
      source: VINTED_ZERO_SELLING_FEE_SOURCE,
    })
  );

  // Optional Bump/Showcase: an actual, user-confirmed cash cost — never a
  // calculated or invented price. Deliberately not sourced with a verified
  // "rate" (there isn't one to verify), so this line correctly suppresses
  // the "fees last verified" banner when present, matching TikTok's
  // "other actual costs" pattern.
  let visibilityServiceCost = ZERO;
  if (input.visibilityServiceCost !== null && input.visibilityServiceCost !== undefined) {
    visibilityServiceCost = money(input.visibilityServiceCost);
    feeLines.push(
      makeFeeLine({
        id: 'vinted-visibility-service',
        label: 'Bump / Showcase (optional, actual amount paid)',
        amount: visibilityServiceCost,
        category: 'advertising',
        platform: 'VINTED',
        feeType: 'visibility_service',
        formula: `User-confirmed actual amount paid (£${toRawNumber(visibilityServiceCost).toFixed(2)}) — Vinted publishes no universal fixed price for Bump/Showcase; the exact cost is shown at checkout`,
        currency: 'GBP',
        // Deliberately no `source` here (unlike the £0 platform-fee line
        // above): this amount is a user-entered actual cost, not a verified
        // rate, so it must not carry a verifiedAt/verificationStatus that
        // would make allLinesVerifiedAsOf (src/lib/verification.ts) treat
        // it as independently confirmed — matching TikTok's "other actual
        // costs" line, which is unsourced for the same reason. See
        // VINTED_PRICELIST_SOURCE for the general (schedule-level) source.
        vatUnconfirmed: true,
        notes:
          'Treated as an actual cash cost, never recalculated from the item price. VAT recovery on this amount is not modelled — this build does not derive a reclaimable VAT figure without an official source establishing the precise VAT split and treatment for this specific charge.',
      })
    );
    assumptions.push(
      `An actual Bump/Showcase cost of £${toRawNumber(visibilityServiceCost).toFixed(2)} you confirmed paying is deducted from profit as entered — Vinted does not publish a universal fixed price for these optional visibility services, so nothing is calculated on your behalf.`
    );
    signals.push('ASSUMPTION_DEPENDENT');
  }

  if (input.sellerRoute === 'PRO') {
    exclusions.push(
      "Pro seller: output VAT, the second-hand VAT margin scheme, and any other tax on this sale are not calculated. The correct VAT/tax treatment depends on you, the item, and whether a margin scheme applies — Vinted's Pro guide requires your listing price to already include applicable VAT/taxes. Vinted charging no mandatory seller platform fee does not mean this sale is free of VAT/tax obligations."
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  // Buyer Protection: an INDICATIVE typical range only, computed from the
  // published "usually 3%-8% + £0.30-£0.80" wording — never the exact
  // checkout figure (only Vinted calculates and shows that). Paid by the
  // buyer, on the item/bundle price only (never shipping or optional Item
  // Verification charges). Deliberately kept OFF the CalculationResult's
  // fee/total plumbing — see buildResult below and CalculationResult's own
  // doc comment — so it can never be summed into seller fees or profit.
  const buyerProtectionRange = {
    low: toRawNumber(percentOf(itemSubtotal, VINTED_BUYER_PROTECTION_RANGE.lowPct).plus(VINTED_BUYER_PROTECTION_RANGE.lowFixed)),
    high: toRawNumber(percentOf(itemSubtotal, VINTED_BUYER_PROTECTION_RANGE.highPct).plus(VINTED_BUYER_PROTECTION_RANGE.highFixed)),
    note:
      'Indicative typical range only, based on Vinted\'s published "usually 3%-8% + £0.30-£0.80" wording — not an exact fee, quote or guarantee, and not a checkout total. The actual fee depends on Vinted\'s own factors (item characteristics, order value, single item vs bundle) and is calculated and displayed by Vinted to the buyer at checkout. Excludes buyer-paid shipping and any optional Item Verification charge.',
  };

  return buildResult({
    grossRevenue,
    cogs,
    shippingCost,
    platformTransactionFee: ZERO,
    advertisingFee: visibilityServiceCost,
    feeLines,
    assumptions,
    exclusions,
    confidence: worstConfidence(signals),
    buyerProtectionRange,
  });
}
