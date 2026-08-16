import { money, sum, toRawNumber, ZERO, type Money } from '../decimal';
import { safeRatioPct, type CalculationResult, type ConfidenceLevel, type FeeLine } from '../types';
import type { VatProfile } from '../../data/vat';

export interface ResultParts {
  grossRevenue: Money;
  cogs: Money;
  shippingCost: Money;

  platformTransactionFee?: Money;
  paymentProcessingFee?: Money;
  listingFee?: Money;
  regulatoryFee?: Money;
  internationalFee?: Money;
  currencyConversionFee?: Money;
  advertisingFee?: Money;
  allocatedSubscriptionCost?: Money;

  vatOnFees?: Money;
  potentiallyReclaimableVat?: Money;

  feeLines: FeeLine[];
  assumptions: string[];
  exclusions: string[];
  confidence: ConfidenceLevel;
}

/**
 * Assembles the shared CalculationResult shape from engine-specific parts.
 * Profit is calculated from TOTAL CASH FEES (ex-VAT fee + any VAT actually
 * charged on it) — the amount that actually leaves the seller's account at
 * the point of sale. Potentially-reclaimable VAT is surfaced separately
 * because a VAT-registered business recovers it later via its VAT return,
 * not at the point of sale — see /methodology.
 */
export function buildResult(parts: ResultParts): CalculationResult {
  const platformTransactionFee = parts.platformTransactionFee ?? ZERO;
  const paymentProcessingFee = parts.paymentProcessingFee ?? ZERO;
  const listingFee = parts.listingFee ?? ZERO;
  const regulatoryFee = parts.regulatoryFee ?? ZERO;
  const internationalFee = parts.internationalFee ?? ZERO;
  const currencyConversionFee = parts.currencyConversionFee ?? ZERO;
  const advertisingFee = parts.advertisingFee ?? ZERO;
  const allocatedSubscriptionCost = parts.allocatedSubscriptionCost ?? ZERO;
  const vatOnFees = parts.vatOnFees ?? ZERO;
  const potentiallyReclaimableVat = parts.potentiallyReclaimableVat ?? ZERO;

  const exVatFees = sum([
    platformTransactionFee,
    paymentProcessingFee,
    listingFee,
    regulatoryFee,
    internationalFee,
    currencyConversionFee,
    advertisingFee,
    allocatedSubscriptionCost,
  ]);

  const totalCashFees = exVatFees.plus(vatOnFees);
  const estimatedEconomicFees = totalCashFees.minus(potentiallyReclaimableVat);

  const profit = parts.grossRevenue.minus(parts.cogs).minus(parts.shippingCost).minus(totalCashFees);
  const investedCost = parts.cogs.plus(parts.shippingCost);

  const grossRevenueNum = toRawNumber(parts.grossRevenue);
  const profitNum = toRawNumber(profit);

  return {
    grossRevenue: grossRevenueNum,
    cogs: toRawNumber(parts.cogs),
    shippingCost: toRawNumber(parts.shippingCost),
    platformTransactionFee: toRawNumber(platformTransactionFee),
    paymentProcessingFee: toRawNumber(paymentProcessingFee),
    listingFee: toRawNumber(listingFee),
    regulatoryFee: toRawNumber(regulatoryFee),
    internationalFee: toRawNumber(internationalFee),
    currencyConversionFee: toRawNumber(currencyConversionFee),
    advertisingFee: toRawNumber(advertisingFee),
    allocatedSubscriptionCost: toRawNumber(allocatedSubscriptionCost),
    vatOnFees: toRawNumber(vatOnFees),
    potentiallyReclaimableVat: toRawNumber(potentiallyReclaimableVat),
    totalCashFees: toRawNumber(totalCashFees),
    estimatedEconomicFees: toRawNumber(estimatedEconomicFees),
    estimatedProfit: profitNum,
    marginPct: safeRatioPct(profitNum, grossRevenueNum),
    roiPct: safeRatioPct(profitNum, toRawNumber(investedCost)),
    confidence: parts.confidence,
    feeLines: parts.feeLines,
    assumptions: parts.assumptions,
    exclusions: parts.exclusions,
  };
}

/** Allocates a monthly subscription/fixed cost across expected monthly volume.
 *  Returns ZERO (and leaves it unallocated) when volume isn't provided —
 *  per the brief, a monthly cost must never be dumped entirely on one sale. */
export function allocateMonthly(monthlyCost: number, expectedMonthlyVolume: number | null | undefined): Money {
  if (!expectedMonthlyVolume || expectedMonthlyVolume <= 0) return ZERO;
  return money(monthlyCost).dividedBy(expectedMonthlyVolume);
}

export function applyStandardVat(amount: Money, rate: number): Money {
  return amount.times(rate);
}

export function reclaimableIfRegistered(vatAmount: Money, vatProfile: VatProfile): Money {
  return vatProfile === 'REGISTERED' ? vatAmount : ZERO;
}
