import { describe, expect, it } from 'vitest';
import { calculateShopify, type ShopifyInput } from '../shopify';

const base: ShopifyInput = {
  soldPrice: 100,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  plan: 'BASIC',
  processor: 'SHOPIFY_PAYMENTS',
  cardType: 'STANDARD',
};

describe('Shopify acceptance tests', () => {
  it('S01: Basic, Shopify Payments, standard card, £30 -> £0.85', () => {
    const r = calculateShopify({ ...base, soldPrice: 30, plan: 'BASIC', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(0.85, 6);
  });

  it('S02: Grow, standard card, £100 -> £1.95', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'GROW', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(1.95, 6);
  });

  it('S03: Advanced, standard card, £100 -> £1.75', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'ADVANCED', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(1.75, 6);
  });

  it('S04: Basic, international/Amex, £100 -> £3.35', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'BASIC', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(3.35, 6);
  });

  it('S05: Grow, international/Amex, £100 -> £2.95', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'GROW', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(2.95, 6);
  });

  it('S06: Advanced, international/Amex, £100 -> £2.75', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'ADVANCED', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(2.75, 6);
  });

  it('S07: Basic + third-party processor + £100, no processor rate -> Shopify fee £2.00, external excluded, EXCLUDES_VARIABLE_FEES', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'BASIC', processor: 'THIRD_PARTY' });
    expect(r.platformTransactionFee).toBeCloseTo(2.0, 6);
    expect(r.paymentProcessingFee).toBe(0);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('S08: Basic + third-party processor + £100 + 1.5%+£0.20 assumption -> Shopify £2.00, processor £1.70, total £3.70', () => {
    const r = calculateShopify({
      ...base,
      soldPrice: 100,
      plan: 'BASIC',
      processor: 'THIRD_PARTY',
      thirdPartyProcessor: { rate: 0.015, fixed: 0.2 },
    });
    expect(r.platformTransactionFee).toBeCloseTo(2.0, 6);
    expect(r.paymentProcessingFee).toBeCloseTo(1.7, 6);
    expect(r.platformTransactionFee + r.paymentProcessingFee).toBeCloseTo(3.7, 6);
    expect(r.confidence).toBe('ASSUMPTION_DEPENDENT');
  });

  it('S09: Basic £25/mo / 100 expected monthly orders -> £0.25/order allocated', () => {
    const r = calculateShopify({ ...base, expectedMonthlyOrders: 100 });
    expect(r.allocatedSubscriptionCost).toBeCloseTo(0.25, 6);
  });
});
