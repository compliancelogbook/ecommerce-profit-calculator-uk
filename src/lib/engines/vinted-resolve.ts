import { calculateVinted, type VintedSellerRoute } from './vinted';
import { parseRequiredPositiveAmount, type ValidationResult } from '../validation';
import type { CalculationResult } from '../types';

/** Raw, string-typed Vinted panel state — the shape VintedPanel.tsx collects from its form fields. */
export interface VintedRawPanelInput {
  sellerRoute: VintedSellerRoute;
  visibilityServicePurchased: boolean;
  visibilityServiceCost: string;
}

export interface VintedPanelErrors {
  visibilityServiceCost?: string;
}

/** The shared transaction fields, already parsed to numbers by the caller (CalculatorShell). */
export interface VintedResolveSharedInput {
  soldPrice: number;
  itemCost: number;
  /** The shared "Shipping Charged" field, relabelled for Vinted as the amount actually received by the seller. */
  shippingReceived: number;
  /** The shared "Actual Shipping Cost" field — shipping the seller paid themselves. */
  shippingCost: number;
  quantity: number;
}

export interface VintedResolution {
  errors: VintedPanelErrors;
  hasBlockingError: boolean;
  result: CalculationResult | null;
}

function err<T>(r: ValidationResult<T>): string | undefined {
  return r.ok ? undefined : r.error;
}

/**
 * Composes Vinted panel validation with the engine call in one place, the
 * same pattern as resolveTikTok — an enabled-but-invalid Bump/Showcase
 * amount BLOCKS the whole result (never silently becomes £0, and never
 * silently excluded while the rest of the calculation continues to look
 * complete).
 */
export function resolveVinted(shared: VintedResolveSharedInput, panel: VintedRawPanelInput): VintedResolution {
  const costR = panel.visibilityServicePurchased
    ? parseRequiredPositiveAmount(panel.visibilityServiceCost, 'Bump/Showcase amount paid')
    : ({ ok: true, value: 0 } as const);

  const errors: VintedPanelErrors = {
    visibilityServiceCost: panel.visibilityServicePurchased ? err(costR) : undefined,
  };

  const hasBlockingError = Boolean(errors.visibilityServiceCost);
  if (hasBlockingError) {
    return { errors, hasBlockingError: true, result: null };
  }

  // hasBlockingError already returned above when purchased-but-invalid, so
  // by this point costR.ok is guaranteed whenever visibilityServicePurchased
  // is true — narrow explicitly rather than reaching for a fallback default.
  const visibilityServiceCost = panel.visibilityServicePurchased && costR.ok ? costR.value : null;

  const result = calculateVinted({
    soldPrice: shared.soldPrice,
    itemCost: shared.itemCost,
    quantity: shared.quantity,
    shippingReceived: shared.shippingReceived,
    shippingCost: shared.shippingCost,
    sellerRoute: panel.sellerRoute,
    visibilityServiceCost,
  });

  return { errors, hasBlockingError: false, result };
}
