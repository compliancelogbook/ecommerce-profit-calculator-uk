import { describe, expect, it } from 'vitest';
import { ZERO, money } from '../../decimal';
import { buildResult } from '../shared';
import { calculateShopify } from '../shopify';
import { calculateAmazon } from '../amazon';
import { calculateEbay } from '../ebay';
import { calculateEtsy } from '../etsy';

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

  it('2026-08-16 audit: fractional and non-integer quantities are rejected across every engine, not silently rounded', () => {
    expect(() =>
      calculateEbay({
        itemPrice: 10,
        itemCost: 0,
        shippingCharged: 0,
        shippingCost: 0,
        quantity: 2.5,
        categoryId: 'EVERYTHING_ELSE',
        region: 'DOMESTIC',
        currencyConversionSelected: false,
        topRatedPremiumService: false,
        vatProfile: 'NOT_REGISTERED',
      })
    ).toThrow();
    expect(() =>
      calculateEtsy({
        itemPrice: 10,
        itemCost: 0,
        shippingCharged: 0,
        shippingCost: 0,
        quantity: 0,
        currencyConversionSelected: false,
        offsiteAdsRate: null,
        vatIdSupplied: true,
        vatProfile: 'NOT_REGISTERED',
      })
    ).toThrow();
  });

  it('2026-08-16 audit: fee breakdown reconciles exactly with cash/economic totals (no rounding drift)', () => {
    const r = calculateEbay({
      itemPrice: 1200,
      itemCost: 100,
      shippingCharged: 5,
      shippingCost: 3,
      quantity: 1,
      categoryId: 'JEWELLERY_WATCHES',
      region: 'US_CANADA',
      currencyConversionSelected: true,
      topRatedPremiumService: true,
      vatProfile: 'REGISTERED',
    });

    const exVatSum = r.feeLines.reduce((acc, l) => acc + l.amountExVat, 0);
    const vatSum = r.feeLines.reduce((acc, l) => acc + (l.vatAmount ?? 0), 0);
    expect(exVatSum + vatSum).toBeCloseTo(r.totalCashFees, 6);
    expect(r.totalCashFees - r.potentiallyReclaimableVat).toBeCloseTo(r.estimatedEconomicFees, 6);
    expect(r.grossRevenue - r.cogs - r.shippingCost - r.totalCashFees).toBeCloseTo(r.estimatedProfit, 6);
  });

  it('2026-08-16 audit: confidence precedence holds even for a fully verified category, because Amazon always excludes referral-fee VAT', () => {
    // Amazon always carries the "referral VAT excluded" signal (EXCLUDES_VARIABLE_FEES) —
    // this must win even when every other input (category, plan) is fully SPEC/AUDIT verified.
    const r = calculateAmazon({
      itemPrice: 20,
      itemCost: 0,
      deliveryCharge: 0,
      shippingCost: 0,
      quantity: 1,
      sellerPlan: 'INDIVIDUAL',
      categoryId: 'BOOKS', // AUDIT_VERIFIED as of the 2026-08-16 follow-up audit
      vatProfile: 'NOT_REGISTERED',
    });
    expect(r.exclusions.some((e) => e.includes('VAT on referral fees'))).toBe(true);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('2026-08-16 audit: an AUTOMATED_UNVERIFIED category (if one existed) would still surface a distinct assumption signal', () => {
    // No AUTOMATED_UNVERIFIED Amazon category is currently enabled (see amazon.test.ts), so this
    // exercises the engine's handling path directly via a manual-rate assumption instead —
    // confirming the ASSUMPTION_DEPENDENT signal still fires correctly for genuinely-assumed inputs.
    const r = calculateAmazon({
      itemPrice: 20,
      itemCost: 0,
      deliveryCharge: 0,
      shippingCost: 0,
      quantity: 1,
      sellerPlan: 'INDIVIDUAL',
      categoryId: 'UNSUPPORTED_MANUAL_ENTRY',
      manualCategoryRate: 0.15,
      vatProfile: 'NOT_REGISTERED',
    });
    expect(r.assumptions.some((a) => a.includes('manually entered'))).toBe(true);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES'); // referral-VAT exclusion still wins (worst-of)
  });
});
