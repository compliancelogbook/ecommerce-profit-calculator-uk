import { describe, expect, it } from 'vitest';
import { calculateVinted } from '../vinted';

const base = {
  soldPrice: 30,
  itemCost: 10,
  quantity: 1,
  shippingReceived: 0,
  shippingCost: 0,
  sellerRoute: 'PRIVATE' as const,
  visibilityServiceCost: null,
};

describe('Vinted UK engine', () => {
  it('V01: £30 item, £10 cost, no shipping/promotion -> gross £30, mandatory fee £0, profit £20, Buyer Protection excluded from every total', () => {
    const r = calculateVinted(base);
    expect(r.grossRevenue).toBe(30);
    expect(r.platformTransactionFee).toBe(0);
    expect(r.estimatedProfit).toBeCloseTo(20, 6);
    expect(r.totalCashFees).toBe(0);

    const platformFeeLine = r.feeLines.find((f) => f.id === 'vinted-seller-platform-fee')!;
    expect(platformFeeLine.amountExVat).toBe(0);

    // Buyer Protection must exist as context, but never contribute to any total.
    expect(r.buyerProtectionRange).not.toBeNull();
    expect(r.feeLines.some((f) => f.feeType === 'buyer_protection_fee')).toBe(false);
  });

  it('V02: £30 item, £10 cost, £4 shipping received, £3 seller-paid shipping -> gross £34, profit £21', () => {
    const r = calculateVinted({ ...base, shippingReceived: 4, shippingCost: 3 });
    expect(r.grossRevenue).toBe(34);
    expect(r.estimatedProfit).toBeCloseTo(21, 6);
  });

  it('V03: two £30 items at £10 cost each -> gross £60, COGS £20, seller fee £0, profit £40', () => {
    const r = calculateVinted({ ...base, quantity: 2 });
    expect(r.grossRevenue).toBe(60);
    expect(r.cogs).toBe(20);
    expect(r.platformTransactionFee).toBe(0);
    expect(r.estimatedProfit).toBeCloseTo(40, 6);
  });

  it('V04: a £2.40 actual Bump/Showcase allocation is deducted exactly, never recalculated from the item price', () => {
    const r = calculateVinted({ ...base, visibilityServiceCost: 2.4 });
    const line = r.feeLines.find((f) => f.id === 'vinted-visibility-service')!;
    expect(line.amountExVat).toBe(2.4);
    expect(r.advertisingFee).toBe(2.4);
    expect(r.estimatedProfit).toBeCloseTo(20 - 2.4, 6);

    // Changing the item price must not change the visibility cost — it is never a % of price.
    const r2 = calculateVinted({ ...base, soldPrice: 300, visibilityServiceCost: 2.4 });
    const line2 = r2.feeLines.find((f) => f.id === 'vinted-visibility-service')!;
    expect(line2.amountExVat).toBe(2.4);
  });

  it('V04b: the visibility service line is unsourced (no verifiedAt/verificationStatus) — it is an actual cost, never presented as a verified rate', () => {
    const r = calculateVinted({ ...base, visibilityServiceCost: 2.4 });
    const line = r.feeLines.find((f) => f.id === 'vinted-visibility-service')!;
    expect(line.verifiedAt).toBeUndefined();
    expect(line.verificationStatus).toBeUndefined();
  });

  it('V05: an invalid (blank/malformed/negative) visibility cost throws at the engine boundary rather than becoming £0', () => {
    expect(() => calculateVinted({ ...base, visibilityServiceCost: -1 })).toThrow();
    expect(() => calculateVinted({ ...base, visibilityServiceCost: NaN })).toThrow();
    expect(() => calculateVinted({ ...base, visibilityServiceCost: 0 })).toThrow();
  });

  it('V06: Buyer Protection contextual range for a £20 item -> lower £0.90, upper £2.40, and neither affects fees, profit or margin', () => {
    const r = calculateVinted({ ...base, soldPrice: 20, itemCost: 5 });
    expect(r.buyerProtectionRange!.low).toBeCloseTo(0.9, 6); // 3% * 20 + 0.30
    expect(r.buyerProtectionRange!.high).toBeCloseTo(2.4, 6); // 8% * 20 + 0.80

    const withoutRange = { ...r, buyerProtectionRange: null };
    // Profit/margin/fees are identical regardless of the range's value — proves it never entered the maths.
    expect(withoutRange.estimatedProfit).toBeCloseTo(20 - 5, 6);
    expect(withoutRange.totalCashFees).toBe(0);
    expect(withoutRange.marginPct).toBeCloseTo(((20 - 5) / 20) * 100, 6);
  });

  it('V07: no exact 5% + £0.70 Buyer Protection constant is used by the engine', () => {
    const r = calculateVinted({ ...base, soldPrice: 100 });
    const marketingFigure = 100 * 0.05 + 0.7; // £5.70 — the simplified marketing-page figure
    expect(r.buyerProtectionRange!.low).not.toBeCloseTo(marketingFigure, 2);
    expect(r.buyerProtectionRange!.high).not.toBeCloseTo(marketingFigure, 2);
    // The range itself is the published 3%-8% + £0.30-£0.80 band, not a single point figure.
    expect(r.buyerProtectionRange!.low).toBeCloseTo(100 * 0.03 + 0.3, 6);
    expect(r.buyerProtectionRange!.high).toBeCloseTo(100 * 0.08 + 0.8, 6);
  });

  it('V08: Pro seller route — seller platform fee remains £0, no output VAT is calculated, VAT/margin-scheme exclusion is present', () => {
    const r = calculateVinted({ ...base, sellerRoute: 'PRO' });
    expect(r.platformTransactionFee).toBe(0);
    expect(r.vatOnFees).toBe(0);
    expect(r.exclusions.some((e) => e.includes('margin scheme'))).toBe(true);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('V08b: Private seller with no assumptions/exclusions reports EXACT_FOR_SELECTED_INPUTS', () => {
    const r = calculateVinted(base);
    expect(r.confidence).toBe('EXACT_FOR_SELECTED_INPUTS');
  });

  it('V09: zero, quantity and negative/rounding boundaries are rejected consistently with every other engine', () => {
    expect(() => calculateVinted({ ...base, soldPrice: -1 })).toThrow();
    expect(() => calculateVinted({ ...base, itemCost: -1 })).toThrow();
    expect(() => calculateVinted({ ...base, shippingReceived: -1 })).toThrow();
    expect(() => calculateVinted({ ...base, shippingCost: -1 })).toThrow();
    expect(() => calculateVinted({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateVinted({ ...base, quantity: 1.5 })).toThrow();
    expect(() => calculateVinted({ ...base, quantity: -2 })).toThrow();
    // Zero-value sold price/cost are legitimate (not negative) and must not throw.
    expect(() => calculateVinted({ ...base, soldPrice: 0, itemCost: 0 })).not.toThrow();
    const zero = calculateVinted({ ...base, soldPrice: 0, itemCost: 0 });
    expect(zero.grossRevenue).toBe(0);
    expect(zero.estimatedProfit).toBe(0);
    expect(zero.marginPct).toBeNull();
  });

  it('decimal-safe £19.99 item is not affected by float drift', () => {
    const r = calculateVinted({ ...base, soldPrice: 19.99, itemCost: 0 });
    expect(r.grossRevenue).toBe(19.99);
  });
});
