import {
  SHOPIFY_PLANS,
  shopifyCardSource,
  shopifySubscriptionSource,
  shopifyThirdPartySource,
  type ShopifyPlan,
  type ShopifyPaymentProcessor,
} from '../../data/shopify.fees';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { formatPercent } from '../format';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { allocateMonthly, assertNonNegative, assertValidQuantity, buildResult, makeFeeLine } from './shared';

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
  assertNonNegative('sold price', input.soldPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('shipping charged', input.shippingCharged);
  assertNonNegative('shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);
  if (input.thirdPartyProcessor) {
    assertNonNegative('processor rate', input.thirdPartyProcessor.rate);
    assertNonNegative('processor fixed fee', input.thirdPartyProcessor.fixed);
  }

  const plan = SHOPIFY_PLANS[input.plan];
  const qty = input.quantity;

  const grossRevenue = money(input.soldPrice).times(qty).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(qty);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [];
  const exclusions: string[] = [
    'Shopify billing VAT is excluded from this calculation — check your Shopify invoice for the VAT treatment of these fees.',
  ];
  const signals: ConfidenceLevel[] = [
    // Shopify billing VAT is applicable but not calculated, on every quote — this can never be EXACT_FOR_SELECTED_INPUTS.
    'EXCLUDES_VARIABLE_FEES',
  ];

  let platformTransactionFee = ZERO;
  let paymentProcessingFee = ZERO;

  if (input.processor === 'SHOPIFY_PAYMENTS') {
    const cardRates = input.cardType === 'INTERNATIONAL_AMEX' ? plan.internationalCard : plan.standardCard;
    paymentProcessingFee = percentOf(grossRevenue, cardRates.rate).plus(cardRates.fixed);
    feeLines.push(
      makeFeeLine({
        id: 'shopify-payments',
        label: `Shopify Payments (${input.cardType === 'INTERNATIONAL_AMEX' ? 'international card / Amex' : 'standard UK card'})`,
        amount: paymentProcessingFee,
        category: 'processing',
        platform: 'SHOPIFY',
        feeType: 'payment_processing_fee',
        formula: `${formatPercent(cardRates.rate)} + £${cardRates.fixed.toFixed(2)} on £${toRawNumber(grossRevenue).toFixed(2)}`,
        source: shopifyCardSource(plan, input.cardType),
      })
    );
  } else {
    // Shopify still charges its own transaction fee when a third-party provider is used.
    platformTransactionFee = percentOf(grossRevenue, plan.thirdPartyTransactionFeeRate);
    feeLines.push(
      makeFeeLine({
        id: 'shopify-third-party-fee',
        label: 'Shopify transaction fee (third-party payment provider)',
        amount: platformTransactionFee,
        category: 'transaction',
        platform: 'SHOPIFY',
        feeType: 'transaction_fee',
        formula: `${formatPercent(plan.thirdPartyTransactionFeeRate)} on £${toRawNumber(grossRevenue).toFixed(2)}`,
        source: shopifyThirdPartySource(plan),
      })
    );

    if (input.thirdPartyProcessor) {
      paymentProcessingFee = percentOf(grossRevenue, input.thirdPartyProcessor.rate).plus(input.thirdPartyProcessor.fixed);
      feeLines.push(
        makeFeeLine({
          id: 'external-processor-fee',
          label: 'External payment processor fee (user-entered assumption)',
          amount: paymentProcessingFee,
          category: 'processing',
          platform: 'SHOPIFY',
          feeType: 'payment_processing_fee',
          formula: `${formatPercent(input.thirdPartyProcessor.rate)} + £${input.thirdPartyProcessor.fixed.toFixed(2)} (user-entered)`,
          notes: "User-entered assumption — Shopify does not publish third-party processor rates, and none is assumed automatically.",
        })
      );
      assumptions.push(
        `External processor fee assumed at ${formatPercent(input.thirdPartyProcessor.rate)} + £${input.thirdPartyProcessor.fixed.toFixed(2)} per transaction — this is a user-entered assumption, not a verified rate.`
      );
      signals.push('ASSUMPTION_DEPENDENT');
    } else {
      exclusions.push(
        'External payment processor fee excluded — no processor rate was supplied. Enter your processor\'s rate to include it in the total.'
      );
      signals.push('EXCLUDES_VARIABLE_FEES');
    }
  }

  const allocatedSubscriptionCost = allocateMonthly(plan.monthlySubscription, input.expectedMonthlyOrders);
  if (allocatedSubscriptionCost.gt(0)) {
    feeLines.push(
      makeFeeLine({
        id: 'shopify-subscription-allocated',
        label: `Allocated ${plan.label} subscription (£${plan.monthlySubscription}/mo ÷ ${input.expectedMonthlyOrders} expected orders)`,
        amount: allocatedSubscriptionCost,
        category: 'subscription',
        platform: 'SHOPIFY',
        feeType: 'subscription',
        formula: `£${plan.monthlySubscription} ÷ ${input.expectedMonthlyOrders} orders/mo`,
        source: shopifySubscriptionSource(plan),
      })
    );
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
    confidence: worstConfidence(signals),
  });
}
