import type { SourceRef } from './types';

export type ShopifyPlan = 'BASIC' | 'GROW' | 'ADVANCED';
export type ShopifyPaymentProcessor = 'SHOPIFY_PAYMENTS' | 'THIRD_PARTY';

export const SHOPIFY_SOURCE: SourceRef = {
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
