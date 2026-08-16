import {
  AMAZON_CATEGORIES,
  AMAZON_INDIVIDUAL_FEE_PER_UNIT,
  AMAZON_PROFESSIONAL_MONTHLY_FEE,
  AMAZON_SOURCE,
} from '../../data/amazon.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { UK_STANDARD_VAT_RATE } from '../../data/vat';
import type { VatProfile } from '../../data/vat';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { applySchedule } from '../tiered-fee';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { allocateMonthly, buildResult, reclaimableIfRegistered } from './shared';

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
  /** Required when categoryId === UNSUPPORTED_CATEGORY_ID. */
  manualCategoryRate?: number | null;
  expectedMonthlyUnits?: number | null;
  vatProfile: VatProfile;
}

export function calculateAmazon(input: AmazonInput): CalculationResult {
  const qty = Math.max(1, Math.floor(input.quantity) || 1);
  const grossRevenue = money(input.itemPrice).times(qty).plus(input.deliveryCharge);
  const referralBasis = grossRevenue; // total sales price incl. delivery/gift-wrap, per Amazon's own basis definition
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'Amazon FBA fulfilment, storage and related charges are not included — this calculator covers Fulfilled by Merchant (FBM) only.',
  ];
  let confidence: ConfidenceLevel = 'EXACT_FOR_SELECTED_INPUTS';

  const category = AMAZON_CATEGORIES.find((c) => c.id === input.categoryId);
  let referralFee = ZERO;
  let categoryLabel = 'Unsupported category';

  if (category) {
    const { total } = applySchedule(referralBasis, category.schedule);
    referralFee = total;
    if (category.minimumFee !== undefined && referralFee.lt(category.minimumFee)) {
      referralFee = money(category.minimumFee);
    }
    categoryLabel = category.label;
    if (category.source.verificationStatus === 'AUTOMATED_UNVERIFIED') {
      confidence = 'ASSUMPTION_DEPENDENT';
      assumptions.push(
        `"${category.label}" rate was extracted via automated fetch, not independently verified line-by-line — confirm before relying on it.`
      );
    }
  } else if (input.categoryId === UNSUPPORTED_CATEGORY_ID && typeof input.manualCategoryRate === 'number') {
    referralFee = percentOf(referralBasis, input.manualCategoryRate);
    categoryLabel = 'Manually entered category rate';
    assumptions.push(
      `Category not in the verified schedule — referral fee calculated using a manually entered rate of ${(input.manualCategoryRate * 100).toFixed(1)}%.`
    );
    confidence = 'ASSUMPTION_DEPENDENT';
  } else {
    exclusions.push(
      'Selected category is not in the verified Amazon UK referral fee schedule and no manual rate was supplied — referral fee excluded rather than guessed.'
    );
    confidence = 'EXCLUDES_VARIABLE_FEES';
  }

  feeLines.push({
    id: 'amazon-referral',
    label: `Referral fee — ${categoryLabel}`,
    amountExVat: toRawNumber(referralFee),
    category: 'transaction',
    vatUnconfirmed: true,
    sourceUrl: category?.source.url ?? AMAZON_SOURCE.url,
    verifiedAt: category?.source.verifiedAt ?? null,
    verificationStatus: category?.source.verificationStatus,
    notes: 'VAT on the referral fee is not calculated — Amazon\'s referral-fee VAT treatment was not confirmed. Check your Amazon invoice.',
  });
  exclusions.push('VAT on referral fees is not calculated — check your Amazon seller invoice for the actual VAT charged.');
  if (confidence === 'EXACT_FOR_SELECTED_INPUTS') confidence = 'EXCLUDES_VARIABLE_FEES';

  let individualFee = ZERO;
  let allocatedSubscriptionCost = ZERO;
  let subscriptionVat = ZERO;

  if (input.sellerPlan === 'INDIVIDUAL') {
    individualFee = money(AMAZON_INDIVIDUAL_FEE_PER_UNIT).times(qty);
    const vat = individualFee.times(UK_STANDARD_VAT_RATE);
    subscriptionVat = subscriptionVat.plus(vat);
    feeLines.push({
      id: 'amazon-individual-fee',
      label: `Individual seller fee (£${AMAZON_INDIVIDUAL_FEE_PER_UNIT.toFixed(2)} x ${qty} unit${qty > 1 ? 's' : ''}, excl. VAT)`,
      amountExVat: toRawNumber(individualFee),
      category: 'other',
      vatRate: UK_STANDARD_VAT_RATE,
      vatAmount: toRawNumber(vat),
      sourceUrl: AMAZON_SOURCE.url,
      verifiedAt: AMAZON_SOURCE.verifiedAt,
      verificationStatus: AMAZON_SOURCE.verificationStatus,
    });
  } else {
    allocatedSubscriptionCost = allocateMonthly(AMAZON_PROFESSIONAL_MONTHLY_FEE, input.expectedMonthlyUnits);
    if (allocatedSubscriptionCost.gt(0)) {
      const vat = allocatedSubscriptionCost.times(UK_STANDARD_VAT_RATE);
      subscriptionVat = subscriptionVat.plus(vat);
      feeLines.push({
        id: 'amazon-professional-allocated',
        label: `Allocated Professional plan (£${AMAZON_PROFESSIONAL_MONTHLY_FEE}/mo excl. VAT ÷ ${input.expectedMonthlyUnits} expected units)`,
        amountExVat: toRawNumber(allocatedSubscriptionCost),
        category: 'subscription',
        vatRate: UK_STANDARD_VAT_RATE,
        vatAmount: toRawNumber(vat),
        sourceUrl: AMAZON_SOURCE.url,
        verifiedAt: AMAZON_SOURCE.verifiedAt,
        verificationStatus: AMAZON_SOURCE.verificationStatus,
      });
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
    confidence,
  });
}
