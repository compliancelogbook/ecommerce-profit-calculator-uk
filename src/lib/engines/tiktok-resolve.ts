import { calculateTikTok } from './tiktok';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import type { VatProfile } from '../../data/vat';
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parseOptionalAffiliateRate,
  type ValidationResult,
} from '../validation';
import type { CalculationResult } from '../types';

/** Raw, string-typed TikTok panel state — the shape TikTokPanel.tsx collects from its form fields. */
export interface TikTokRawPanelInput {
  categoryId: string;
  manualCategoryRate: string;
  sellerDiscount: string;
  platformDiscount: string;
  promotionalRateEnabled: boolean;
  promotionalRate: string;
  affiliateCommissionRate: string;
  otherActualCosts: string;
}

export interface TikTokPanelErrors {
  manualCategoryRate?: string;
  promotionalRate?: string;
  affiliateCommissionRate?: string;
  sellerDiscount?: string;
  platformDiscount?: string;
  otherActualCosts?: string;
}

/** The shared transaction fields, already parsed to numbers by the caller (CalculatorShell). */
export interface TikTokResolveSharedInput {
  soldPrice: number;
  itemCost: number;
  /** Shipping charged to the customer — the shared "Shipping Charged" field. */
  shippingCharged: number;
  /** The seller's own actual shipping/fulfilment cost — the shared "Actual Shipping Cost" field. */
  shippingCost: number;
  quantity: number;
  vatProfile: VatProfile;
}

export interface TikTokResolution {
  errors: TikTokPanelErrors;
  hasBlockingError: boolean;
  result: CalculationResult | null;
}

function err<T>(r: ValidationResult<T>): string | undefined {
  return r.ok ? undefined : r.error;
}
function val<T>(r: ValidationResult<T>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export const DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE =
  'Seller discount plus platform discount cannot exceed the original product price × quantity.';

/**
 * Composes TikTok panel validation with the engine call in ONE place that is
 * both what CalculatorShell renders from and what tests exercise directly —
 * so an enabled-but-invalid rate can never again silently fall back to "no
 * override" and continue as an apparently-exact calculation (the 2026-08-31
 * launch-blocker class of bug). A promotional rate that's enabled but
 * invalid, or a supplied (nonblank) invalid affiliate rate, or discounts
 * that exceed the product subtotal, all BLOCK the result entirely — they are
 * never silently excluded and never silently normalised.
 */
export function resolveTikTok(shared: TikTokResolveSharedInput, panel: TikTokRawPanelInput): TikTokResolution {
  const manualActive = panel.categoryId === UNSUPPORTED_CATEGORY_ID;
  const manualRateR = parseManualCategoryRate(panel.manualCategoryRate);
  const promoRateR = parseManualCategoryRate(panel.promotionalRate);
  const affiliateRateR = parseOptionalAffiliateRate(panel.affiliateCommissionRate);
  const sellerDiscountR = parseNonNegativeAmount(panel.sellerDiscount, 'Seller discount');
  const platformDiscountR = parseNonNegativeAmount(panel.platformDiscount, 'Platform discount');
  const otherCostsR = parseNonNegativeAmount(panel.otherActualCosts, 'Other TikTok Shop costs');

  const sellerDiscountVal = val(sellerDiscountR, 0);
  const platformDiscountVal = val(platformDiscountR, 0);
  const productSubtotal = shared.soldPrice * shared.quantity;
  const discountsExceedSubtotal =
    sellerDiscountR.ok && platformDiscountR.ok && sellerDiscountVal + platformDiscountVal > productSubtotal;

  const errors: TikTokPanelErrors = {
    manualCategoryRate: manualActive ? err(manualRateR) : undefined,
    // Enabled-but-invalid promotional rate affects the CORE platform commission — blocking, never soft-excluded.
    promotionalRate: panel.promotionalRateEnabled ? err(promoRateR) : undefined,
    // A supplied (nonblank) invalid affiliate rate is blocking too; blank/0 is valid ("not applicable"), never an error.
    affiliateCommissionRate: err(affiliateRateR),
    sellerDiscount: err(sellerDiscountR) ?? (discountsExceedSubtotal ? DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE : undefined),
    platformDiscount: err(platformDiscountR) ?? (discountsExceedSubtotal ? DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE : undefined),
    otherActualCosts: err(otherCostsR),
  };

  const hasBlockingError = Boolean(
    errors.sellerDiscount ||
      errors.platformDiscount ||
      errors.otherActualCosts ||
      errors.promotionalRate ||
      errors.affiliateCommissionRate
  );

  if (hasBlockingError) {
    return { errors, hasBlockingError: true, result: null };
  }

  const result = calculateTikTok({
    soldPrice: shared.soldPrice,
    itemCost: shared.itemCost,
    customerPaidShipping: shared.shippingCharged,
    shippingCost: shared.shippingCost,
    quantity: shared.quantity,
    sellerDiscount: sellerDiscountVal,
    platformDiscount: platformDiscountVal,
    categoryId: panel.categoryId,
    manualCategoryRate: manualActive ? val(manualRateR, null) : null,
    promotionalRate: panel.promotionalRateEnabled ? val(promoRateR, null) : null,
    affiliateCommissionRate: val(affiliateRateR, null),
    otherActualCosts: val(otherCostsR, 0),
    vatProfile: shared.vatProfile,
  });

  return { errors, hasBlockingError: false, result };
}
