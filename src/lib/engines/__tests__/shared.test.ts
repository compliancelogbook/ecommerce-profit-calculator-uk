import { describe, expect, it } from 'vitest';
import { ZERO, money } from '../../decimal';
import { buildResult } from '../shared';
import { calculateShopify } from '../shopify';
import { calculateAmazon } from '../amazon';

describe('Shared engine tests', () => {
  it('C01: zero revenue and zero costs -> profit £0, margin/ROI null, no Infinity/NaN', () => {
    const r = buildResult({
      grossRevenue: ZERO,
      cogs: ZERO,
      shippingCost: ZERO,
      feeLines: [],
      assumptions: [],
      exclusions: [],
      confidence: 'EXACT_FOR_SELECTED_INPUTS',
    });
    expect(r.estimatedProfit).toBe(0);
    expect(r.marginPct).toBeNull();
    expect(r.roiPct).toBeNull();
    expect(Number.isFinite(r.estimatedProfit)).toBe(true);
    expect(Number.isNaN(r.marginPct)).toBe(false);
  });

  it('C02: negative-profit scenario -> profit -£6, negative margin displays correctly', () => {
    const r = buildResult({
      grossRevenue: money(10),
      cogs: money(12),
      shippingCost: money(3),
      platformTransactionFee: money(1),
      feeLines: [],
      assumptions: [],
      exclusions: [],
      confidence: 'EXACT_FOR_SELECTED_INPUTS',
    });
    expect(r.estimatedProfit).toBeCloseTo(-6, 6);
    expect(r.marginPct).not.toBeNull();
    expect(r.marginPct!).toBeLessThan(0);
  });

  it('C03: £19.99 percentage calculation is decimal-safe', () => {
    const r = calculateShopify({
      soldPrice: 19.99,
      itemCost: 0,
      shippingCharged: 0,
      shippingCost: 0,
      quantity: 1,
      plan: 'BASIC',
      processor: 'SHOPIFY_PAYMENTS',
      cardType: 'STANDARD',
    });
    // 19.99 * 0.02 + 0.25 = 0.6498 exactly — plain JS floats give 0.6498000000000001.
    expect(r.paymentProcessingFee).toBe(0.6498);
  });

  it('C04: per-unit fixed charges vs order-level percentage charges follow the real basis', () => {
    // Amazon Individual fee is genuinely per unit sold.
    const amazonQty3 = calculateAmazon({
      itemPrice: 30,
      itemCost: 0,
      deliveryCharge: 0,
      shippingCost: 0,
      quantity: 3,
      sellerPlan: 'INDIVIDUAL',
      categoryId: 'JEWELLERY',
      vatProfile: 'NOT_REGISTERED',
    });
    const individualFeeLine = amazonQty3.feeLines.find((f) => f.id === 'amazon-individual-fee')!;
    expect(individualFeeLine.amountExVat).toBeCloseTo(0.75 * 3, 6);
    // Referral fee is order-level: computed on total sale value (30*3=90), not per unit then multiplied.
    const referralLine = amazonQty3.feeLines.find((f) => f.id === 'amazon-referral')!;
    expect(referralLine.amountExVat).toBeCloseTo(90 * 0.2, 6);

    // Shopify's fixed £0.25 per-transaction fee must NOT be multiplied by quantity.
    const shopifyQty3 = calculateShopify({
      soldPrice: 10,
      itemCost: 0,
      shippingCharged: 0,
      shippingCost: 0,
      quantity: 3,
      plan: 'BASIC',
      processor: 'SHOPIFY_PAYMENTS',
      cardType: 'STANDARD',
    });
    // basis = 10*3 = 30; fee = 30*0.02 + 0.25 (fixed charged once, not x3)
    expect(shopifyQty3.paymentProcessingFee).toBeCloseTo(30 * 0.02 + 0.25, 6);
  });
});
