import {
  DEFAULT_USD_TO_GBP_RATE,
  ETSY_CURRENCY_CONVERSION_RATE,
  ETSY_CURRENCY_CONVERSION_SOURCE,
  ETSY_CURRENCY_CONVERSION_VAT,
  ETSY_LISTING_FEE_USD,
  ETSY_LISTING_FEE_VAT,
  ETSY_OFFSITE_ADS_CAP_USD,
  ETSY_OFFSITE_ADS_SOURCE,
  ETSY_OFFSITE_ADS_VAT,
  ETSY_PAYMENTS_FEE,
  ETSY_PAYMENTS_FEE_VAT,
  ETSY_REGULATORY_FEE_RATE,
  ETSY_REGULATORY_FEE_VAT,
  ETSY_SOURCES,
  ETSY_TRANSACTION_FEE_RATE,
  ETSY_TRANSACTION_FEE_VAT,
  type EtsyFeeVatTreatment,
  type EtsyOffsiteAdsRate,
} from '../../data/etsy.fees';
import type { SourceRef } from '../../data/types';
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { formatPercent } from '../format';
import { money, percentOf, ZERO, type Money } from '../decimal';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeCategory, FeeLine } from '../types';
import { assertNonNegative, assertValidQuantity, buildResult, makeFeeLine, reclaimableIfRegistered } from './shared';

export interface EtsyInput {
  itemPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  currencyConversionSelected: boolean;
  offsiteAdsRate: EtsyOffsiteAdsRate | null;
  vatIdSupplied: boolean;
  vatProfile: VatProfile;
  /**
   * Explicit, user-editable USD->GBP assumption. `undefined` = not provided,
   * falls back to the spec fixture 0.75. `null` = the caller has an
   * unusable value (blank/invalid) — rather than silently substituting a
   * default the user didn't ask for, the FX-dependent fees (listing,
   * Offsite Ads) are excluded instead of guessed.
   */
  usdToGbpRate?: number | null;
}

function vatFor(amount: Money, treatment: EtsyFeeVatTreatment, vatIdSupplied: boolean): { vat: Money; unconfirmed: boolean } {
  if (treatment === 'UNCONFIRMED') return { vat: ZERO, unconfirmed: true };
  const vat = vatIdSupplied ? ZERO : amount.times(UK_STANDARD_VAT_RATE);
  return { vat, unconfirmed: false };
}

export function calculateEtsy(input: EtsyInput): CalculationResult {
  assertNonNegative('item price', input.itemPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('shipping charged', input.shippingCharged);
  assertNonNegative('shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);

  // `null` = caller has an unusable FX value (blank/invalid) — exclude FX-dependent
  // fees rather than guess. `undefined` = not provided at all, use the default.
  const fxUnusable = input.usdToGbpRate === null;
  const fxRate = fxUnusable ? null : (input.usdToGbpRate ?? DEFAULT_USD_TO_GBP_RATE);
  if (fxRate !== null && !(fxRate > 0)) {
    throw new Error(`Invalid USD->GBP rate: must be a positive finite number, got ${fxRate}.`);
  }

  const qty = input.quantity;

  const grossRevenue = money(input.itemPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);
  const feeBasis = grossRevenue; // Etsy % fees are charged on item price + shipping charged to the buyer.

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [];
  const signals: ConfidenceLevel[] = [];

  if (fxRate !== null) {
    assumptions.push(`US$ → £ conversion assumed at ${fxRate.toFixed(2)} (user-editable assumption, not a live FX rate).`);
    // Etsy always relies on a disclosed, user-controlled FX assumption for the listing fee.
    signals.push('ASSUMPTION_DEPENDENT');
  } else {
    exclusions.push(
      'No usable US$ → £ exchange rate was supplied — the listing fee (and Offsite Ads fee, if selected) are excluded rather than guessed. Enter a valid rate to include them.'
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  // Etsy charges the US$0.20 listing fee once per unit sold, not once per order.
  const listingFee = fxRate !== null ? money(ETSY_LISTING_FEE_USD).times(qty).times(fxRate) : ZERO;
  const transactionFee = percentOf(feeBasis, ETSY_TRANSACTION_FEE_RATE);
  const paymentsFee = percentOf(feeBasis, ETSY_PAYMENTS_FEE.rate).plus(ETSY_PAYMENTS_FEE.fixed);
  const regulatoryFee = percentOf(feeBasis, ETSY_REGULATORY_FEE_RATE);

  let currencyConversionFee = ZERO;
  if (input.currencyConversionSelected) {
    currencyConversionFee = percentOf(feeBasis, ETSY_CURRENCY_CONVERSION_RATE);
  }

  let advertisingFee = ZERO;
  if (input.offsiteAdsRate && fxRate !== null) {
    const uncapped = percentOf(feeBasis, input.offsiteAdsRate);
    const capGBP = money(ETSY_OFFSITE_ADS_CAP_USD).times(fxRate);
    advertisingFee = uncapped.gt(capGBP) ? capGBP : uncapped;
    if (uncapped.gt(capGBP)) {
      assumptions.push(
        `Offsite Ads fee capped at US$${ETSY_OFFSITE_ADS_CAP_USD}/order (≈£${capGBP.toFixed(2)} at the assumed FX rate) — uncapped fee would have been £${uncapped.toFixed(2)}.`
      );
    }
  }

  const lineDefs: Array<{
    id: string;
    label: string;
    amount: Money;
    category: FeeCategory;
    feeType: string;
    formula: string;
    vatTreatment: EtsyFeeVatTreatment;
    source: SourceRef | null;
  }> = [
    {
      id: 'etsy-listing',
      label:
        fxRate !== null
          ? `Listing fee (US$${ETSY_LISTING_FEE_USD.toFixed(2)} × ${qty} unit${qty > 1 ? 's' : ''} × ${fxRate.toFixed(2)} FX)`
          : 'Listing fee (excluded — no usable exchange rate)',
      amount: listingFee,
      category: 'listing',
      feeType: 'listing_fee',
      formula:
        fxRate !== null
          ? `US$${ETSY_LISTING_FEE_USD.toFixed(2)} per unit sold × ${qty} × ${fxRate.toFixed(2)} USD→GBP`
          : `US$${ETSY_LISTING_FEE_USD.toFixed(2)} per unit sold × ${qty} — excluded, no usable USD→GBP rate`,
      vatTreatment: ETSY_LISTING_FEE_VAT,
      source: ETSY_SOURCES.feesAndTaxes,
    },
    {
      id: 'etsy-transaction',
      label: 'Transaction fee (6.5%)',
      amount: transactionFee,
      category: 'transaction',
      feeType: 'transaction_fee',
      formula: `${formatPercent(ETSY_TRANSACTION_FEE_RATE)} of item price + postage`,
      vatTreatment: ETSY_TRANSACTION_FEE_VAT,
      source: ETSY_SOURCES.feesAndTaxes,
    },
    {
      id: 'etsy-payments',
      label: 'Etsy Payments processing fee',
      amount: paymentsFee,
      category: 'processing',
      feeType: 'payment_processing_fee',
      formula: `${formatPercent(ETSY_PAYMENTS_FEE.rate)} + £${ETSY_PAYMENTS_FEE.fixed.toFixed(2)} of item price + postage`,
      vatTreatment: ETSY_PAYMENTS_FEE_VAT,
      source: ETSY_SOURCES.paymentProcessing,
    },
    {
      id: 'etsy-regulatory',
      label: 'UK Regulatory Operating Fee (0.48%)',
      amount: regulatoryFee,
      category: 'regulatory',
      feeType: 'regulatory_operating_fee',
      formula: `${formatPercent(ETSY_REGULATORY_FEE_RATE)} of item price + postage`,
      vatTreatment: ETSY_REGULATORY_FEE_VAT,
      source: ETSY_SOURCES.regulatoryOperatingFee,
    },
  ];
  if (input.currencyConversionSelected) {
    lineDefs.push({
      id: 'etsy-conversion',
      label: 'Currency conversion fee (2.5%)',
      amount: currencyConversionFee,
      category: 'conversion',
      feeType: 'currency_conversion_fee',
      formula: `${formatPercent(ETSY_CURRENCY_CONVERSION_RATE)} of the relevant conversion basis`,
      vatTreatment: ETSY_CURRENCY_CONVERSION_VAT,
      source: ETSY_CURRENCY_CONVERSION_SOURCE,
    });
  }
  if (input.offsiteAdsRate) {
    lineDefs.push({
      id: 'etsy-offsite-ads',
      label:
        fxRate !== null
          ? `Offsite Ads fee (${input.offsiteAdsRate * 100}%)`
          : 'Offsite Ads fee (excluded — no usable exchange rate for the cap)',
      amount: advertisingFee,
      category: 'advertising',
      feeType: 'advertising_fee',
      formula:
        fxRate !== null
          ? `${formatPercent(input.offsiteAdsRate)} of order total, capped at US$${ETSY_OFFSITE_ADS_CAP_USD}/order`
          : `${formatPercent(input.offsiteAdsRate)} of order total — excluded, no usable USD→GBP rate for the cap`,
      vatTreatment: ETSY_OFFSITE_ADS_VAT,
      source: ETSY_OFFSITE_ADS_SOURCE,
    });
  }

  const unconfirmedVatLines: string[] = [];
  let vatOnFees: Money = ZERO;

  for (const line of lineDefs) {
    const { vat, unconfirmed } = vatFor(line.amount, line.vatTreatment, input.vatIdSupplied);
    if (unconfirmed) {
      unconfirmedVatLines.push(line.label);
      // A real, applicable fee is present but its VAT can't be confirmed — that's a missing
      // applicable fee component, not merely a disclosed assumption.
      signals.push('EXCLUDES_VARIABLE_FEES');
    } else {
      vatOnFees = vatOnFees.plus(vat);
    }
    feeLines.push(
      makeFeeLine({
        id: line.id,
        label: line.label,
        amount: line.amount,
        category: line.category,
        platform: 'ETSY',
        feeType: line.feeType,
        formula: line.formula,
        source: line.source ?? undefined,
        vatRate: unconfirmed ? undefined : input.vatIdSupplied ? 0 : UK_STANDARD_VAT_RATE,
        vatAmount: unconfirmed ? undefined : vat,
        vatUnconfirmed: unconfirmed,
      })
    );
  }

  if (unconfirmedVatLines.length > 0) {
    exclusions.push(
      `VAT treatment not independently confirmed for: ${unconfirmedVatLines.join(', ')}. Shown ex-VAT — check your Etsy invoice for the actual VAT charged on these specific fees.`
    );
  }
  assumptions.push(
    input.vatIdSupplied
      ? 'VAT ID on file with Etsy — reverse charge assumed for VAT-eligible fees (0% charged by Etsy).'
      : 'No VAT ID on file with Etsy — 20% UK VAT assumed on VAT-eligible fees, per Etsy\'s published fee/VAT policy.'
  );

  const potentiallyReclaimableVat = reclaimableIfRegistered(vatOnFees, input.vatProfile);

  return buildResult({
    grossRevenue,
    cogs,
    shippingCost,
    listingFee,
    platformTransactionFee: transactionFee,
    paymentProcessingFee: paymentsFee,
    regulatoryFee,
    currencyConversionFee,
    advertisingFee,
    vatOnFees,
    potentiallyReclaimableVat,
    feeLines,
    assumptions,
    exclusions,
    confidence: worstConfidence(signals),
  });
}
