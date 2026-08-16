import {
  AMAZON_CATEGORIES,
  AMAZON_INDIVIDUAL_FEE_PER_UNIT,
  AMAZON_PROFESSIONAL_MONTHLY_FEE,
  AMAZON_SOURCE,
} from '../../data/amazon.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { money, percentOf, ZERO } from '../decimal';
import { applySchedule } from '../tiered-fee';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { allocateMonthly, assertNonNegative, assertValidQuantity, buildResult, makeFeeLine, reclaimableIfRegistered } from './shared';

export type AmazonSellerPlan = 'INDIVIDUAL' | 'PROFESSIONAL';

export interface AmazonInput {
  itemPrice: number;
  itemCost: number;
  /** Delivery / gift-wrap charge to the buyer — included in the referral-fee basis. */
  deliveryCharge: number;
  shippingCost: number;
  quantity: number;
  sellerPlan: AmazonSellerPlan;
  categoryId: string;
  /** Required when categoryId === UNSUPPORTED_CATEGORY_ID (fraction, e.g. 0.15 = 15%). Must be a valid, >0 number; 0/negative/absent are all treated as "not supplied". */
  manualCategoryRate?: number | null;
  expectedMonthlyUnits?: number | null;
  vatProfile: VatProfile;
}

function isValidManualRate(rate: number | null | undefined): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 && rate <= 1;
}

export function calculateAmazon(input: AmazonInput): CalculationResult {
  assertNonNegative('item price', input.itemPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('delivery charge', input.deliveryCharge);
  assertNonNegative('shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);

  const qty = input.quantity;
  const grossRevenue = money(input.itemPrice).times(qty).plus(input.deliveryCharge);
  const referralBasis = grossRevenue; // total sales price incl. delivery/gift-wrap, per Amazon's own basis definition
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'Amazon FBA fulfilment, storage and related charges are not included — this calculator covers Fulfilled by Merchant (FBM) only.',
    'VAT on referral fees is not calculated — check your Amazon seller invoice for the actual VAT charged.',
  ];
  // Referral-fee VAT is applicable but never calculated (see exclusion above) — this can never be EXACT_FOR_SELECTED_INPUTS.
  const signals: ConfidenceLevel[] = ['EXCLUDES_VARIABLE_FEES'];

  const category = AMAZON_CATEGORIES.find((c) => c.id === input.categoryId);
  let referralFee = ZERO;
  let categoryLabel = 'Unsupported category';

  if (category && category.schedule) {
    const { total } = applySchedule(referralBasis, category.schedule);
    referralFee = total;
    if (category.minimumFee !== undefined && referralFee.lt(category.minimumFee)) {
      referralFee = money(category.minimumFee);
    }
    categoryLabel = category.label;
    if (category.source.verificationStatus === 'AUTOMATED_UNVERIFIED') {
      signals.push('ASSUMPTION_DEPENDENT');
      assumptions.push(
        `"${category.label}" rate was extracted via automated fetch, not independently verified line-by-line — confirm before relying on it.`
      );
    }
  } else if (input.categoryId === UNSUPPORTED_CATEGORY_ID && isValidManualRate(input.manualCategoryRate)) {
    referralFee = percentOf(referralBasis, input.manualCategoryRate);
    categoryLabel = 'Manually entered category rate';
    assumptions.push(
      `Category not in the verified schedule — referral fee calculated using a manually entered rate of ${(input.manualCategoryRate * 100).toFixed(1)}%.`
    );
    signals.push('ASSUMPTION_DEPENDENT');
  } else {
    exclusions.push(
      input.categoryId === UNSUPPORTED_CATEGORY_ID
        ? 'No valid manual referral fee rate was supplied (it must be a number greater than 0%) — referral fee excluded rather than guessed.'
        : 'Selected category is not in the verified Amazon UK referral fee schedule and no manual rate was supplied — referral fee excluded rather than guessed.'
    );
    signals.push('EXCLUDES_VARIABLE_FEES');
  }

  feeLines.push(
    makeFeeLine({
      id: 'amazon-referral',
      label: `Referral fee — ${categoryLabel}`,
      amount: referralFee,
      category: 'transaction',
      platform: 'AMAZON',
      feeType: 'referral_fee',
      formula: category ? (category.source.formula ?? categoryLabel) : categoryLabel,
      source: category?.source ?? undefined,
      vatUnconfirmed: true,
      notes: "VAT on the referral fee is not calculated — Amazon's referral-fee VAT treatment was not confirmed. Check your Amazon invoice.",
    })
  );

  let individualFee = ZERO;
  let allocatedSubscriptionCost = ZERO;
  let subscriptionVat = ZERO;

  if (input.sellerPlan === 'INDIVIDUAL') {
    individualFee = money(AMAZON_INDIVIDUAL_FEE_PER_UNIT).times(qty);
    const vat = individualFee.times(UK_STANDARD_VAT_RATE);
    subscriptionVat = subscriptionVat.plus(vat);
    feeLines.push(
      makeFeeLine({
        id: 'amazon-individual-fee',
        label: `Individual seller fee (£${AMAZON_INDIVIDUAL_FEE_PER_UNIT.toFixed(2)} x ${qty} unit${qty > 1 ? 's' : ''}, excl. VAT)`,
        amount: individualFee,
        category: 'other',
        platform: 'AMAZON',
        feeType: 'per_unit_seller_fee',
        formula: `£${AMAZON_INDIVIDUAL_FEE_PER_UNIT.toFixed(2)} per unit sold × ${qty}, excl. VAT`,
        source: AMAZON_SOURCE,
        vatRate: UK_STANDARD_VAT_RATE,
        vatAmount: vat,
      })
    );
  } else {
    allocatedSubscriptionCost = allocateMonthly(AMAZON_PROFESSIONAL_MONTHLY_FEE, input.expectedMonthlyUnits);
    if (allocatedSubscriptionCost.gt(0)) {
      const vat = allocatedSubscriptionCost.times(UK_STANDARD_VAT_RATE);
      subscriptionVat = subscriptionVat.plus(vat);
      feeLines.push(
        makeFeeLine({
          id: 'amazon-professional-allocated',
          label: `Allocated Professional plan (£${AMAZON_PROFESSIONAL_MONTHLY_FEE}/mo excl. VAT ÷ ${input.expectedMonthlyUnits} expected units)`,
          amount: allocatedSubscriptionCost,
          category: 'subscription',
          platform: 'AMAZON',
          feeType: 'subscription',
          formula: `£${AMAZON_PROFESSIONAL_MONTHLY_FEE} ÷ ${input.expectedMonthlyUnits} units/mo, excl. VAT`,
          source: AMAZON_SOURCE,
          vatRate: UK_STANDARD_VAT_RATE,
          vatAmount: vat,
        })
      );
    } else {
      assumptions.push(
        `Professional plan costs £${AMAZON_PROFESSIONAL_MONTHLY_FEE}/month (excl. VAT). Not allocated to this order because an expected monthly unit volume wasn't provided.`
      );
    }
  }

  const vatOnFees = subscriptionVat; // referral-fee VAT intentionally excluded — see exclusions above.
  const potentiallyReclaimableVat = reclaimableIfRegistered(vatOnFees, input.vatProfile);

  return buildResult({
    grossRevenue,
    cogs,
    shippingCost,
    platformTransactionFee: referralFee,
    allocatedSubscriptionCost: allocatedSubscriptionCost.plus(individualFee),
    vatOnFees,
    potentiallyReclaimableVat,
    feeLines,
    assumptions,
    exclusions,
    confidence: worstConfidence(signals),
  });
}
