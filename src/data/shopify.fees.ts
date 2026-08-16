import type { SourceRef } from './types';

export type ShopifyPlan = 'BASIC' | 'GROW' | 'ADVANCED';
export type ShopifyPaymentProcessor = 'SHOPIFY_PAYMENTS' | 'THIRD_PARTY';

const SHOPIFY_META = { platform: 'SHOPIFY', sellerMarket: 'GB', currency: 'GBP' } as const;

export const SHOPIFY_SOURCE: SourceRef = {
  ...SHOPIFY_META,
  feeType: 'subscription',
  formula: 'Fixed monthly plan fee',
  effectiveDate: null,
  url: 'https://www.shopify.com/uk/pricing',
  verifiedAt: '2026-08-16',
  verificationStatus: 'SPEC_VERIFIED',
};

export interface ShopifyPlanConfig {
  id: ShopifyPlan;
  label: string;
  monthlySubscription: number;
  /** Shopify Payments: standard UK online card. */
  standardCard: { rate: number; fixed: number };
  /** Shopify Payments: international cards / Amex. */
  internationalCard: { rate: number; fixed: number };
  /** Shopify's own transaction fee charged when a third-party payment provider is used instead of Shopify Payments. */
  thirdPartyTransactionFeeRate: number;
}

export const SHOPIFY_PLANS: Record<ShopifyPlan, ShopifyPlanConfig> = {
  BASIC: {
    id: 'BASIC',
    label: 'Basic',
    monthlySubscription: 25,
    standardCard: { rate: 0.02, fixed: 0.25 },
    internationalCard: { rate: 0.031, fixed: 0.25 },
    thirdPartyTransactionFeeRate: 0.02,
  },
  GROW: {
    id: 'GROW',
    label: 'Grow',
    monthlySubscription: 65,
    standardCard: { rate: 0.017, fixed: 0.25 },
    internationalCard: { rate: 0.027, fixed: 0.25 },
    thirdPartyTransactionFeeRate: 0.01,
  },
  ADVANCED: {
    id: 'ADVANCED',
    label: 'Advanced',
    monthlySubscription: 344,
    standardCard: { rate: 0.015, fixed: 0.25 },
    internationalCard: { rate: 0.025, fixed: 0.25 },
    thirdPartyTransactionFeeRate: 0.006,
  },
};

export function shopifyCardSource(plan: ShopifyPlanConfig, cardType: 'STANDARD' | 'INTERNATIONAL_AMEX'): SourceRef {
  const rates = cardType === 'INTERNATIONAL_AMEX' ? plan.internationalCard : plan.standardCard;
  return {
    ...SHOPIFY_META,
    feeType: 'payment_processing_fee',
    formula: `${(rates.rate * 100).toFixed(1)}% + £${rates.fixed.toFixed(2)} per transaction`,
    conditions: `${plan.label} plan, Shopify Payments, ${cardType === 'INTERNATIONAL_AMEX' ? 'international card / Amex' : 'standard UK card'}`,
    effectiveDate: null,
    url: SHOPIFY_SOURCE.url,
    verifiedAt: SHOPIFY_SOURCE.verifiedAt,
    verificationStatus: SHOPIFY_SOURCE.verificationStatus,
  };
}

export function shopifyThirdPartySource(plan: ShopifyPlanConfig): SourceRef {
  return {
    ...SHOPIFY_META,
    feeType: 'transaction_fee',
    formula: `${(plan.thirdPartyTransactionFeeRate * 100).toFixed(1)}% of order total`,
    conditions: `${plan.label} plan, third-party payment provider`,
    effectiveDate: null,
    url: SHOPIFY_SOURCE.url,
    verifiedAt: SHOPIFY_SOURCE.verifiedAt,
    verificationStatus: SHOPIFY_SOURCE.verificationStatus,
  };
}

export function shopifySubscriptionSource(plan: ShopifyPlanConfig): SourceRef {
  return {
    ...SHOPIFY_META,
    feeType: 'subscription',
    formula: `£${plan.monthlySubscription}/month`,
    conditions: `${plan.label} plan`,
    effectiveDate: null,
    url: SHOPIFY_SOURCE.url,
    verifiedAt: SHOPIFY_SOURCE.verifiedAt,
    verificationStatus: SHOPIFY_SOURCE.verificationStatus,
  };
}
