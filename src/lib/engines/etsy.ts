import {
  DEFAULT_USD_TO_GBP_RATE,
  ETSY_CURRENCY_CONVERSION_RATE,
  ETSY_CURRENCY_CONVERSION_VAT,
  ETSY_LISTING_FEE_USD,
  ETSY_LISTING_FEE_VAT,
  ETSY_OFFSITE_ADS_CAP_USD,
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
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { money, percentOf, toRawNumber, ZERO, type Money } from '../decimal';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { buildResult, reclaimableIfRegistered } from './shared';

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
  /** Explicit, user-editable USD->GBP assumption (defaults to the spec fixture 0.75). */
  usdToGbpRate?: number;
}

function vatFor(amount: Money, treatment: EtsyFeeVatTreatment, vatIdSupplied: boolean): { vat: Money; unconfirmed: boolean } {
  if (treatment === 'UNCONFIRMED') return { vat: ZERO, unconfirmed: true };
  const vat = vatIdSupplied ? ZERO : amount.times(UK_STANDARD_VAT_RATE);
  return { vat, unconfirmed: false };
}

export function calculateEtsy(input: EtsyInput): CalculationResult {
  const qty = Math.max(1, Math.floor(input.quantity) || 1);
  const fxRate = input.usdToGbpRate ?? DEFAULT_USD_TO_GBP_RATE;

  const grossRevenue = money(input.itemPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);
  const feeBasis = grossRevenue; // Etsy % fees are charged on item price + shipping charged to the buyer.

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [
    `US$ → £ conversion assumed at ${fxRate.toFixed(2)} (user-editable assumption, not a live FX rate).`,
  ];
  const exclusions: string[] = [];
  let confidence: ConfidenceLevel = 'EXACT_FOR_SELECTED_INPUTS';

  const listingFee = money(ETSY_LISTING_FEE_USD).times(fxRate);
  const transactionFee = percentOf(feeBasis, ETSY_TRANSACTION_FEE_RATE);
  const paymentsFee = percentOf(feeBasis, ETSY_PAYMENTS_FEE.rate).plus(ETSY_PAYMENTS_FEE.fixed);
  const regulatoryFee = percentOf(feeBasis, ETSY_REGULATORY_FEE_RATE);

  let currencyConversionFee = ZERO;
  if (input.currencyConversionSelected) {
    currencyConversionFee = percentOf(feeBasis, ETSY_CURRENCY_CONVERSION_RATE);
  }

  let advertisingFee = ZERO;
  if (input.offsiteAdsRate) {
    const uncapped = percentOf(feeBasis, input.offsiteAdsRate);
    const capGBP = money(ETSY_OFFSITE_ADS_CAP_USD).times(fxRate);
    advertisingFee = uncapped.gt(capGBP) ? capGBP : uncapped;
    if (uncapped.gt(capGBP)) {
      assumptions.push(
        `Offsite Ads fee capped at US$${ETSY_OFFSITE_ADS_CAP_USD}/order (≈£${capGBP.toFixed(2)} at the assumed FX rate) — uncapped fee would have been £${uncapped.toFixed(2)}.`
      );
    }
  }

  const lineDefs: Array<{ id: string; label: string; amount: Money; category: FeeLine['category']; vatTreatment: EtsyFeeVatTreatment; sourceKey: keyof typeof ETSY_SOURCES | null }> = [
    { id: 'etsy-listing', label: 'Listing fee', amount: listingFee, category: 'listing', vatTreatment: ETSY_LISTING_FEE_VAT, sourceKey: 'feesAndTaxes' },
    { id: 'etsy-transaction', label: 'Transaction fee (6.5%)', amount: transactionFee, category: 'transaction', vatTreatment: ETSY_TRANSACTION_FEE_VAT, sourceKey: 'feesAndTaxes' },
    { id: 'etsy-payments', label: 'Etsy Payments processing fee', amount: paymentsFee, category: 'processing', vatTreatment: ETSY_PAYMENTS_FEE_VAT, sourceKey: 'paymentProcessing' },
    { id: 'etsy-regulatory', label: 'UK Regulatory Operating Fee (0.48%)', amount: regulatoryFee, category: 'regulatory', vatTreatment: ETSY_REGULATORY_FEE_VAT, sourceKey: 'regulatoryOperatingFee' },
  ];
  if (input.currencyConversionSelected) {
    lineDefs.push({ id: 'etsy-conversion', label: 'Currency conversion fee (2.5%)', amount: currencyConversionFee, category: 'conversion', vatTreatment: ETSY_CURRENCY_CONVERSION_VAT, sourceKey: null });
  }
  if (input.offsiteAdsRate) {
    lineDefs.push({ id: 'etsy-offsite-ads', label: `Offsite Ads fee (${input.offsiteAdsRate * 100}%)`, amount: advertisingFee, category: 'advertising', vatTreatment: ETSY_OFFSITE_ADS_VAT, sourceKey: null });
  }

  let vatOnFees = ZERO;
  const unconfirmedVatLines: string[] = [];

  for (const line of lineDefs) {
    const { vat, unconfirmed } = vatFor(line.amount, line.vatTreatment, input.vatIdSupplied);
    vatOnFees = vatOnFees.plus(vat);
    if (unconfirmed) unconfirmedVatLines.push(line.label);
    const source = line.sourceKey ? ETSY_SOURCES[line.sourceKey] : undefined;
    feeLines.push({
      id: line.id,
      label: line.label,
      amountExVat: toRawNumber(line.amount),
      category: line.category,
      vatRate: unconfirmed ? undefined : input.vatIdSupplied ? 0 : UK_STANDARD_VAT_RATE,
      vatAmount: unconfirmed ? undefined : toRawNumber(vat),
      vatUnconfirmed: unconfirmed,
      sourceUrl: source?.url,
      verifiedAt: source?.verifiedAt,
      verificationStatus: source?.verificationStatus,
    });
  }

  if (unconfirmedVatLines.length > 0) {
    exclusions.push(
      `VAT treatment not independently confirmed for: ${unconfirmedVatLines.join(', ')}. Shown ex-VAT — check your Etsy invoice for the actual VAT charged on these specific fees.`
    );
    confidence = 'ASSUMPTION_DEPENDENT';
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
    confidence,
  });
}
