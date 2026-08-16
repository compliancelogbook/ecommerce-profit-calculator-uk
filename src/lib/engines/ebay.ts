import {
  EBAY_CATEGORIES,
  EBAY_CURRENCY_CONVERSION_RATE,
  EBAY_CURRENCY_CONVERSION_SOURCE,
  EBAY_INTERNATIONAL_FEE_RATES,
  EBAY_INTERNATIONAL_FEE_SOURCE,
  EBAY_PER_ORDER_FEE,
  EBAY_PER_ORDER_FEE_SOURCE,
  EBAY_REGULATORY_FEE_RATE,
  EBAY_REGULATORY_FEE_SOURCE,
  EBAY_TOP_RATED_DISCOUNT_RATE,
  type EbayInternationalRegion,
} from '../../data/ebay.fees';
import { UNSUPPORTED_CATEGORY_ID, type SourceRef } from '../../data/types';
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { formatPercent } from '../format';
import { money, percentOf, sum, ZERO, type Money } from '../decimal';
import { applySchedule } from '../tiered-fee';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeCategory, FeeLine } from '../types';
import { assertNonNegative, assertValidQuantity, buildResult, makeFeeLine, reclaimableIfRegistered } from './shared';

export interface EbayInput {
  itemPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  categoryId: string;
  /** Used when categoryId === UNSUPPORTED_CATEGORY_ID, or when the selected category has no confirmed FVF `schedule` — a manual, clearly-labelled percentage (fraction, e.g. 0.125 = 12.5%). Must be a valid, >0 number; 0/negative/absent are all treated as "not supplied". */
  manualCategoryRate?: number | null;
  region: EbayInternationalRegion;
  currencyConversionSelected: boolean;
  topRatedPremiumService: boolean;
  vatProfile: VatProfile;
}

function isValidManualRate(rate: number | null | undefined): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 && rate <= 1;
}

export function calculateEbay(input: EbayInput): CalculationResult {
  assertNonNegative('item price', input.itemPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('shipping charged', input.shippingCharged);
  assertNonNegative('shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);

  const qty = input.quantity;
  const totalSaleBasis = money(input.itemPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'eBay seller-performance penalties and Promoted Listings costs are not included by default.',
  ];
  const signals: ConfidenceLevel[] = [];
  const vatAmounts: Money[] = [];

  // eBay UK Business seller fees are published exclusive of VAT — 20% UK VAT
  // is added to every fee line individually (not just as a lump total) so
  // the breakdown reconciles against totalCashFees without hidden math.
  function pushLine(params: {
    id: string;
    label: string;
    amount: Money;
    category: FeeCategory;
    feeType: string;
    formula: string;
    source?: SourceRef;
    notes?: string;
  }) {
    const vat = params.amount.times(UK_STANDARD_VAT_RATE);
    vatAmounts.push(vat);
    feeLines.push(
      makeFeeLine({
        ...params,
        platform: 'EBAY',
        vatRate: UK_STANDARD_VAT_RATE,
        vatAmount: vat,
      })
    );
  }

  const category = EBAY_CATEGORIES.find((c) => c.id === input.categoryId);

  let variableFvf = ZERO;
  let categoryLabel = 'Unsupported category';
  let fvfIsPartial = false; // true when postage was excluded from a per-item tier basis due to an UNCONFIRMED allocation — the FVF shown is NOT the complete exact fee.
  let fvfExcludesPostageByRule = false; // true when the category's OWN published rule excludes postage from its basis — a confirmed, complete calculation, not a limitation.

  if (category?.schedule) {
    categoryLabel = category.officialCategoryId ? `${category.label} (#${category.officialCategoryId})` : category.label;

    // Tiered/threshold schedules calculated PER ITEM must be evaluated once
    // per unit and then multiplied — applying them to the combined order
    // total lets multiple items collectively cross a threshold that none
    // of them crosses individually, which is wrong (2026-08-16 audit fix).
    if (category.tierBasis === 'PER_ITEM' && category.schedule.kind !== 'FLAT') {
      let perItemBasis: Money;
      if (category.thresholdExcludesPostage) {
        // A small number of categories (e.g. Trainers) have a CONFIRMED published rule that their
        // basis is the item's own selling price only, excluding postage — at any quantity. This is
        // a complete, correct calculation, not an unconfirmed-allocation limitation.
        perItemBasis = money(input.itemPrice);
        fvfExcludesPostageByRule = true;
      } else if (qty === 1) {
        // For a single item, "per item" and "per order" are the same basis — eBay's own
        // "total amount of the sale" definition includes postage, unambiguous here.
        perItemBasis = money(input.itemPrice).plus(input.shippingCharged);
      } else {
        // For multiple items, postage's allocation across items is NOT confirmed by any
        // primary source found, so it is deliberately excluded from the per-item tier
        // basis (see exclusion pushed below) rather than invented (e.g. split evenly).
        perItemBasis = money(input.itemPrice);
      }
      const { total: perItemFee } = applySchedule(perItemBasis, category.schedule);
      variableFvf = perItemFee.times(qty);
      if (!fvfExcludesPostageByRule && qty > 1 && input.shippingCharged > 0) {
        fvfIsPartial = true;
        exclusions.push(
          `The Final Value Fee shown for ${categoryLabel} is INCOMPLETE, not a complete exact fee: shipping charged (£${input.shippingCharged.toFixed(2)}) was excluded from the per-item tier calculation because how eBay allocates postage across multiple items for tier purposes is not confirmed by any primary source found, so it was not guessed. The per-order regulatory/international/conversion fees below still include the full postage charged.`
        );
        signals.push('EXCLUDES_VARIABLE_FEES');
      }
    } else {
      const { total } = applySchedule(totalSaleBasis, category.schedule);
      variableFvf = total;
    }
  } else if (category && !category.schedule) {
    // A known, structured category (has an official ID / a confirmed reduced
    // per-order fee) but its variable FVF rate itself was not confirmed —
    // requires the same manual-rate fallback as an unsupported category,
    // while still keeping the category's real identity for labelling.
    categoryLabel = category.officialCategoryId ? `${category.label} (#${category.officialCategoryId})` : category.label;
    if (isValidManualRate(input.manualCategoryRate)) {
      variableFvf = percentOf(totalSaleBasis, input.manualCategoryRate);
      assumptions.push(
        `${categoryLabel}: Final Value Fee percentage is not confirmed for this category — calculated using a manually entered rate of ${(input.manualCategoryRate * 100).toFixed(1)}%.`
      );
      signals.push('ASSUMPTION_DEPENDENT');
    } else {
      exclusions.push(
        `${categoryLabel}: no confirmed Final Value Fee percentage and no valid manual rate was supplied — Final Value Fee excluded rather than guessed. (Its reduced per-order fee, if applicable, is still calculated below — that part is confirmed independently.)`
      );
      signals.push('EXCLUDES_VARIABLE_FEES');
    }
  } else if (input.categoryId === UNSUPPORTED_CATEGORY_ID && isValidManualRate(input.manualCategoryRate)) {
    variableFvf = percentOf(totalSaleBasis, input.manualCategoryRate);
    categoryLabel = 'Manually entered category rate';
    assumptions.push(
      `Category not in the verified schedule — Final Value Fee calculated using a manually entered rate of ${(input.manualCategoryRate * 100).toFixed(1)}%.`
    );
    signals.push('ASSUMPTION_DEPENDENT');
  } else {
    exclusions.push(
      input.categoryId === UNSUPPORTED_CATEGORY_ID
        ? 'No valid manual Final Value Fee rate was supplied (it must be a number greater than 0%) — Final Value Fee excluded rather than guessed.'
        : 'Selected category is not in the verified eBay UK Business fee schedule and no manual rate was supplied — Final Value Fee excluded rather than guessed.'
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  let discountApplied = ZERO;
  if (input.topRatedPremiumService && variableFvf.gt(0)) {
    discountApplied = variableFvf.times(EBAY_TOP_RATED_DISCOUNT_RATE);
    variableFvf = variableFvf.minus(discountApplied);
  }

  pushLine({
    id: 'ebay-variable-fvf',
    label: `Final Value Fee — ${categoryLabel}${input.topRatedPremiumService && discountApplied.gt(0) ? ' (after 10% Top Rated discount)' : ''}${fvfIsPartial ? ' — INCOMPLETE (postage excluded)' : ''}`,
    amount: variableFvf,
    category: 'transaction',
    feeType: 'final_value_fee',
    formula: category?.source.formula ?? categoryLabel,
    source: category?.source,
    notes: fvfIsPartial
      ? 'This figure excludes any postage-related portion of the per-item Final Value Fee for quantity > 1 — it is not a complete exact fee. See exclusions.'
      : fvfExcludesPostageByRule
        ? 'This category\'s published rate is based on the item\'s own selling price only — postage is excluded by eBay\'s own rule for this category, not a limitation of this calculation.'
        : undefined,
  });

  // Reduced per-order fee eligibility comes ENTIRELY from the selected category's own
  // confirmed data — there is no user-assertable toggle. A manual/unsupported category
  // (no `category` match, or UNSUPPORTED_CATEGORY_ID) can never receive this reduction,
  // because eligibility cannot be established for an arbitrary manual entry.
  const reducedFeeRule = category?.reducedPerOrderFee;
  const saleQualifiesForReduction = Boolean(reducedFeeRule) && totalSaleBasis.lte(reducedFeeRule!.atOrBelowThreshold);
  const perOrderFee = money(
    category?.perOrderFeeOverride ??
      (saleQualifiesForReduction
        ? reducedFeeRule!.fee
        : totalSaleBasis.lte(EBAY_PER_ORDER_FEE.threshold)
          ? EBAY_PER_ORDER_FEE.atOrBelow
          : EBAY_PER_ORDER_FEE.above)
  );
  pushLine({
    id: 'ebay-per-order',
    label: saleQualifiesForReduction
      ? `Per-order fee (reduced rate — ${categoryLabel} qualifies, sale ≤ £${reducedFeeRule!.atOrBelowThreshold})`
      : `Per-order fee (${totalSaleBasis.lte(EBAY_PER_ORDER_FEE.threshold) ? `sale ≤ £${EBAY_PER_ORDER_FEE.threshold}` : `sale > £${EBAY_PER_ORDER_FEE.threshold}`})`,
    amount: perOrderFee,
    category: 'transaction',
    feeType: 'per_order_fee',
    formula: saleQualifiesForReduction ? (reducedFeeRule!.source.formula ?? '') : (EBAY_PER_ORDER_FEE_SOURCE.formula ?? ''),
    source: saleQualifiesForReduction ? reducedFeeRule!.source : EBAY_PER_ORDER_FEE_SOURCE,
  });

  const regulatoryFee = percentOf(totalSaleBasis, EBAY_REGULATORY_FEE_RATE);
  pushLine({
    id: 'ebay-regulatory',
    label: 'UK Regulatory Operating Fee (0.35%)',
    amount: regulatoryFee,
    category: 'regulatory',
    feeType: 'regulatory_operating_fee',
    formula: `${formatPercent(EBAY_REGULATORY_FEE_RATE)} of the total-sale basis`,
    source: EBAY_REGULATORY_FEE_SOURCE,
  });

  let internationalFee = ZERO;
  if (input.region !== 'DOMESTIC') {
    internationalFee = percentOf(totalSaleBasis, EBAY_INTERNATIONAL_FEE_RATES[input.region]);
    pushLine({
      id: 'ebay-international',
      label: `International fee (${input.region.replace(/_/g, ' ').toLowerCase()})`,
      amount: internationalFee,
      category: 'international',
      feeType: 'international_fee',
      formula: `${formatPercent(EBAY_INTERNATIONAL_FEE_RATES[input.region])} of the total-sale basis`,
      source: EBAY_INTERNATIONAL_FEE_SOURCE,
    });
  }

  let currencyConversionFee = ZERO;
  if (input.currencyConversionSelected) {
    currencyConversionFee = percentOf(totalSaleBasis, EBAY_CURRENCY_CONVERSION_RATE);
    pushLine({
      id: 'ebay-conversion',
      label: 'Currency conversion fee (2.5%)',
      amount: currencyConversionFee,
      category: 'conversion',
      feeType: 'currency_conversion_fee',
      formula: `${formatPercent(EBAY_CURRENCY_CONVERSION_RATE)} of the relevant basis`,
      source: EBAY_CURRENCY_CONVERSION_SOURCE,
    });
  }

  const vatOnFees = sum(vatAmounts);
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
    confidence: worstConfidence(signals),
  });
}
