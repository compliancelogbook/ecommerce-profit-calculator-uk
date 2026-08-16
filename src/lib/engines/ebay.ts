import {
  EBAY_CATEGORIES,
  EBAY_CURRENCY_CONVERSION_RATE,
  EBAY_INTERNATIONAL_FEE_RATES,
  EBAY_PER_ORDER_FEE,
  EBAY_REGULATORY_FEE_RATE,
  EBAY_SOURCE,
  EBAY_TOP_RATED_DISCOUNT_RATE,
  type EbayInternationalRegion,
} from '../../data/ebay.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { applySchedule } from '../tiered-fee';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { buildResult, reclaimableIfRegistered } from './shared';

export interface EbayInput {
  itemPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  categoryId: string;
  /** Required when categoryId === UNSUPPORTED_CATEGORY_ID — a manual, clearly-labelled percentage. */
  manualCategoryRate?: number | null;
  region: EbayInternationalRegion;
  currencyConversionSelected: boolean;
  topRatedPremiumService: boolean;
  vatProfile: VatProfile;
}

export function calculateEbay(input: EbayInput): CalculationResult {
  const qty = Math.max(1, Math.floor(input.quantity) || 1);
  const totalSaleBasis = money(input.itemPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'eBay seller-performance penalties and Promoted Listings costs are not included by default.',
  ];
  let confidence: ConfidenceLevel = 'EXACT_FOR_SELECTED_INPUTS';

  const category = EBAY_CATEGORIES.find((c) => c.id === input.categoryId);

  let variableFvf = ZERO;
  let categoryLabel = 'Unsupported category';

  if (category) {
    const { total } = applySchedule(totalSaleBasis, category.schedule);
    variableFvf = total;
    categoryLabel = category.label;
  } else if (input.categoryId === UNSUPPORTED_CATEGORY_ID && typeof input.manualCategoryRate === 'number') {
    variableFvf = percentOf(totalSaleBasis, input.manualCategoryRate);
    categoryLabel = 'Manually entered category rate';
    assumptions.push(
      `Category not in the verified schedule — Final Value Fee calculated using a manually entered rate of ${(input.manualCategoryRate * 100).toFixed(1)}%.`
    );
    confidence = 'ASSUMPTION_DEPENDENT';
  } else {
    exclusions.push(
      'Selected category is not in the verified eBay UK Business fee schedule and no manual rate was supplied — Final Value Fee excluded rather than guessed.'
    );
    confidence = 'EXCLUDES_VARIABLE_FEES';
  }

  let discountApplied = ZERO;
  if (input.topRatedPremiumService && variableFvf.gt(0)) {
    discountApplied = variableFvf.times(EBAY_TOP_RATED_DISCOUNT_RATE);
    variableFvf = variableFvf.minus(discountApplied);
  }

  feeLines.push({
    id: 'ebay-variable-fvf',
    label: `Final Value Fee — ${categoryLabel}${input.topRatedPremiumService && discountApplied.gt(0) ? ' (after 10% Top Rated discount)' : ''}`,
    amountExVat: toRawNumber(variableFvf),
    category: 'transaction',
    sourceUrl: category?.source.url ?? EBAY_SOURCE.url,
    verifiedAt: category?.source.verifiedAt ?? null,
    verificationStatus: category?.source.verificationStatus,
  });

  const perOrderFee = money(
    category?.perOrderFeeOverride ?? (totalSaleBasis.lte(EBAY_PER_ORDER_FEE.threshold) ? EBAY_PER_ORDER_FEE.atOrBelow : EBAY_PER_ORDER_FEE.above)
  );
  feeLines.push({
    id: 'ebay-per-order',
    label: `Per-order fee (${totalSaleBasis.lte(EBAY_PER_ORDER_FEE.threshold) ? `sale ≤ £${EBAY_PER_ORDER_FEE.threshold}` : `sale > £${EBAY_PER_ORDER_FEE.threshold}`})`,
    amountExVat: toRawNumber(perOrderFee),
    category: 'transaction',
    sourceUrl: EBAY_SOURCE.url,
    verifiedAt: EBAY_SOURCE.verifiedAt,
    verificationStatus: EBAY_SOURCE.verificationStatus,
  });

  const regulatoryFee = percentOf(totalSaleBasis, EBAY_REGULATORY_FEE_RATE);
  feeLines.push({
    id: 'ebay-regulatory',
    label: 'UK Regulatory Operating Fee (0.35%)',
    amountExVat: toRawNumber(regulatoryFee),
    category: 'regulatory',
    sourceUrl: EBAY_SOURCE.url,
    verifiedAt: EBAY_SOURCE.verifiedAt,
    verificationStatus: EBAY_SOURCE.verificationStatus,
  });

  let internationalFee = ZERO;
  if (input.region !== 'DOMESTIC') {
    internationalFee = percentOf(totalSaleBasis, EBAY_INTERNATIONAL_FEE_RATES[input.region]);
    feeLines.push({
      id: 'ebay-international',
      label: `International fee (${input.region.replace(/_/g, ' ').toLowerCase()})`,
      amountExVat: toRawNumber(internationalFee),
      category: 'international',
      sourceUrl: EBAY_SOURCE.url,
      verifiedAt: EBAY_SOURCE.verifiedAt,
      verificationStatus: EBAY_SOURCE.verificationStatus,
    });
  }

  let currencyConversionFee = ZERO;
  if (input.currencyConversionSelected) {
    currencyConversionFee = percentOf(totalSaleBasis, EBAY_CURRENCY_CONVERSION_RATE);
    feeLines.push({
      id: 'ebay-conversion',
      label: 'Currency conversion fee (2.5%)',
      amountExVat: toRawNumber(currencyConversionFee),
      category: 'conversion',
      sourceUrl: EBAY_SOURCE.url,
      verifiedAt: EBAY_SOURCE.verifiedAt,
      verificationStatus: EBAY_SOURCE.verificationStatus,
    });
  }

  const exVatTotal = variableFvf.plus(perOrderFee).plus(regulatoryFee).plus(internationalFee).plus(currencyConversionFee);
  const vatOnFees = exVatTotal.times(UK_STANDARD_VAT_RATE);
  const potentiallyReclaimableVat = reclaimableIfRegistered(vatOnFees, input.vatProfile);

  assumptions.push('eBay UK Business seller fees are published exclusive of VAT; 20% UK VAT is assumed on top of all fee lines.');

  return buildResult({
    grossRevenue: totalSaleBasis,
    cogs,
    shippingCost,
    platformTransactionFee: variableFvf.plus(perOrderFee),
    regulatoryFee,
    internationalFee,
    currencyConversionFee,
    vatOnFees,
    potentiallyReclaimableVat,
    feeLines,
    assumptions,
    exclusions,
    confidence,
  });
}
