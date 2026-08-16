import { SHOPIFY_PLANS, SHOPIFY_SOURCE, type ShopifyPlan, type ShopifyPaymentProcessor } from '../../data/shopify.fees';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { formatPercent } from '../format';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { allocateMonthly, buildResult } from './shared';

export type ShopifyCardType = 'STANDARD' | 'INTERNATIONAL_AMEX';

export interface ShopifyInput {
  soldPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  plan: ShopifyPlan;
  processor: ShopifyPaymentProcessor;
  cardType: ShopifyCardType;
  /** User-entered assumption for the external processor, labelled as such. Only used when processor === 'THIRD_PARTY'. */
  thirdPartyProcessor?: { rate: number; fixed: number } | null;
  expectedMonthlyOrders?: number | null;
}

export function calculateShopify(input: ShopifyInput): CalculationResult {
  const plan = SHOPIFY_PLANS[input.plan];
  const qty = Math.max(1, Math.floor(input.quantity) || 1);

  const grossRevenue = money(input.soldPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'Shopify billing VAT is excluded from this calculation — check your Shopify invoice for the VAT treatment of these fees.',
  ];
  let confidence: ConfidenceLevel = 'EXACT_FOR_SELECTED_INPUTS';

  let platformTransactionFee = ZERO;
  let paymentProcessingFee = ZERO;

  if (input.processor === 'SHOPIFY_PAYMENTS') {
    const cardRates = input.cardType === 'INTERNATIONAL_AMEX' ? plan.internationalCard : plan.standardCard;
    paymentProcessingFee = percentOf(grossRevenue, cardRates.rate).plus(cardRates.fixed);
    feeLines.push({
      id: 'shopify-payments',
      label: `Shopify Payments (${input.cardType === 'INTERNATIONAL_AMEX' ? 'international card / Amex' : 'standard UK card'})`,
      amountExVat: toRawNumber(paymentProcessingFee),
      category: 'processing',
      sourceUrl: SHOPIFY_SOURCE.url,
      verifiedAt: SHOPIFY_SOURCE.verifiedAt,
      verificationStatus: SHOPIFY_SOURCE.verificationStatus,
    });
  } else {
    // Shopify still charges its own transaction fee when a third-party provider is used.
    platformTransactionFee = percentOf(grossRevenue, plan.thirdPartyTransactionFeeRate);
    feeLines.push({
      id: 'shopify-third-party-fee',
      label: 'Shopify transaction fee (third-party payment provider)',
      amountExVat: toRawNumber(platformTransactionFee),
      category: 'transaction',
      sourceUrl: SHOPIFY_SOURCE.url,
      verifiedAt: SHOPIFY_SOURCE.verifiedAt,
      verificationStatus: SHOPIFY_SOURCE.verificationStatus,
    });

    if (input.thirdPartyProcessor) {
      paymentProcessingFee = percentOf(grossRevenue, input.thirdPartyProcessor.rate).plus(input.thirdPartyProcessor.fixed);
      feeLines.push({
        id: 'external-processor-fee',
        label: 'External payment processor fee (user-entered assumption)',
        amountExVat: toRawNumber(paymentProcessingFee),
        category: 'processing',
        notes: 'User-entered assumption — Shopify does not publish third-party processor rates, and none is assumed automatically.',
      });
      assumptions.push(
        `External processor fee assumed at ${formatPercent(input.thirdPartyProcessor.rate)} + £${input.thirdPartyProcessor.fixed.toFixed(2)} per transaction — this is a user-entered assumption, not a verified rate.`
      );
      confidence = 'ASSUMPTION_DEPENDENT';
    } else {
      exclusions.push(
        'External payment processor fee excluded — no processor rate was supplied. Enter your processor\'s rate to include it in the total.'
      );
      confidence = 'EXCLUDES_VARIABLE_FEES';
    }
  }

  const allocatedSubscriptionCost = allocateMonthly(plan.monthlySubscription, input.expectedMonthlyOrders);
  if (allocatedSubscriptionCost.gt(0)) {
    feeLines.push({
      id: 'shopify-subscription-allocated',
      label: `Allocated ${plan.label} subscription (£${plan.monthlySubscription}/mo ÷ ${input.expectedMonthlyOrders} expected orders)`,
      amountExVat: toRawNumber(allocatedSubscriptionCost),
      category: 'subscription',
      sourceUrl: SHOPIFY_SOURCE.url,
      verifiedAt: SHOPIFY_SOURCE.verifiedAt,
      verificationStatus: SHOPIFY_SOURCE.verificationStatus,
    });
  } else {
    assumptions.push(
      `${plan.label} plan costs £${plan.monthlySubscription}/month. Not allocated to this order because an expected monthly order volume wasn't provided.`
    );
  }

  return buildResult({
    grossRevenue,
    cogs,
    shippingCost,
    platformTransactionFee,
    paymentProcessingFee,
    allocatedSubscriptionCost,
    feeLines,
    assumptions,
    exclusions,
    confidence,
  });
}
