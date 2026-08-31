import { describe, expect, it } from 'vitest';
import { calculateTikTok, type TikTokInput } from '../tiktok';
import { TIKTOK_CATEGORIES } from '../../../data/tiktok.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../../data/types';
import { formatGBP } from '../../format';

const base: TikTokInput = {
  soldPrice: 100,
  itemCost: 0,
  customerPaidShipping: 0,
  shippingCost: 0,
  quantity: 1,
  sellerDiscount: 0,
  platformDiscount: 0,
  categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', // 9%
  otherActualCosts: 0,
  vatProfile: 'NOT_REGISTERED',
};

function line(r: ReturnType<typeof calculateTikTok>, id: string) {
  return r.feeLines.find((f) => f.id === id);
}

describe('TikTok Shop UK acceptance tests', () => {
  it('£100 standard (9%) category -> £9 platform commission, exact for a non-VAT-registered seller', () => {
    const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
    expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6);
    expect(r.platformTransactionFee).toBeCloseTo(9, 6);
    expect(r.confidence).toBe('EXACT_FOR_SELECTED_INPUTS');
  });

  it('£100 verified reduced (5%) category -> £5 platform commission', () => {
    const r = calculateTikTok({ ...base, categoryId: 'HOUSEHOLD_APPLIANCES__ALL' });
    expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(5, 6);
    expect(r.platformTransactionFee).toBeCloseTo(5, 6);
  });

  it("TikTok's worked example: £100 product, £10 seller discount, £10 platform discount, £5 customer-paid shipping -> £95 basis, £8.55 commission at 9%", () => {
    const r = calculateTikTok({
      ...base,
      soldPrice: 100,
      sellerDiscount: 10,
      platformDiscount: 10,
      customerPaidShipping: 5,
      categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', // 9%
    });
    expect(r.grossRevenue).toBeCloseTo(95, 6);
    expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(8.55, 6);
    // The platform discount must not appear in the basis at all — a sanity
    // check that changing it alone (basis unchanged) doesn't move the result.
    const withoutPlatformDiscount = calculateTikTok({
      ...base,
      soldPrice: 100,
      sellerDiscount: 10,
      platformDiscount: 0,
      customerPaidShipping: 5,
      categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
    });
    expect(withoutPlatformDiscount.grossRevenue).toBeCloseTo(95, 6);
    expect(line(withoutPlatformDiscount, 'tiktok-commission')?.amountExVat).toBeCloseTo(8.55, 6);
  });

  it('commission is inclusive of VAT — no vatOnFees, no vatAmount/vatRate, but vatInclusive is flagged on the line', () => {
    const r = calculateTikTok({ ...base });
    expect(r.vatOnFees).toBe(0);
    expect(r.potentiallyReclaimableVat).toBe(0);
    const commissionLine = line(r, 'tiktok-commission');
    expect(commissionLine?.vatAmount).toBeUndefined();
    expect(commissionLine?.vatRate).toBeUndefined();
    expect(commissionLine?.vatInclusive).toBe(true);
  });

  describe('every workbook row resolves to its expected rate', () => {
    it.each(TIKTOK_CATEGORIES.map((c) => [c.id, c.rate] as const))('%s -> %f%%', (id, rate) => {
      const r = calculateTikTok({ ...base, categoryId: id });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(100 * rate, 6);
    });
  });

  describe('promotional/manual rate never stacks with the category rate', () => {
    it('a promotional override REPLACES the category rate — not added to it, and adds ASSUMPTION_DEPENDENT', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', promotionalRate: 0.03 });
      // 3%, not 9% + 3% = 12%.
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(3, 6);
      expect(r.confidence).toBe('ASSUMPTION_DEPENDENT');
    });

    it('a promotional override applies even when the category is unsupported/manual', () => {
      const r = calculateTikTok({
        ...base,
        categoryId: UNSUPPORTED_CATEGORY_ID,
        manualCategoryRate: 0.2,
        promotionalRate: 0.04,
      });
      // Promotional (4%) wins outright — the 20% manual rate is never blended in.
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(4, 6);
    });

    it('an unsupported category with a valid manual rate and no promotional override uses the manual rate alone', () => {
      const r = calculateTikTok({ ...base, categoryId: UNSUPPORTED_CATEGORY_ID, manualCategoryRate: 0.12 });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(12, 6);
      expect(r.confidence).toBe('ASSUMPTION_DEPENDENT');
    });

    it('an unsupported category with no manual rate and no promotional override excludes commission rather than guessing', () => {
      const r = calculateTikTok({ ...base, categoryId: UNSUPPORTED_CATEGORY_ID });
      expect(line(r, 'tiktok-commission')).toBeUndefined();
      expect(r.platformTransactionFee).toBe(0);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      expect(r.exclusions.length).toBeGreaterThan(0);
    });

    it('a supplied but invalid promotional rate is REJECTED at the engine boundary — never silently falls back to the category rate', () => {
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', promotionalRate: 0 })).toThrow();
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', promotionalRate: -0.05 })).toThrow();
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', promotionalRate: 1.5 })).toThrow();
    });
  });

  describe('affiliate commission: own basis, separate from platform commission', () => {
    // https://seller-uk.tiktok.com/university/essay?knowledge_id=7753826522154754
    // affiliateBasis = product price - seller discount - platform discount
    // — excludes customer-paid shipping, and (unlike the platform basis) DOES
    // subtract the platform discount. Guaranteed non-negative by the
    // combined-discount guard (see "discount validation" below) — never floored.
    it("corrected worked example: £100 product, £10 seller discount, £10 platform discount, £5 customer-paid shipping, 9% platform rate, 10% affiliate rate -> platform basis £95.00/£8.55, affiliate basis £80.00/£8.00", () => {
      const r = calculateTikTok({
        ...base,
        soldPrice: 100,
        sellerDiscount: 10,
        platformDiscount: 10,
        customerPaidShipping: 5,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', // 9%
        affiliateCommissionRate: 0.1,
      });
      expect(r.grossRevenue).toBeCloseTo(95, 6); // platform basis
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(8.55, 6);
      expect(line(r, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(8.0, 6); // 10% of £80
      expect(r.advertisingFee).toBeCloseTo(8.0, 6);
    });

    it('affiliate commission is its own fee line, additive to (not blended with) the platform commission', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.1 });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6); // unchanged
      expect(line(r, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(10, 6); // 10% of £100 basis (no discounts in `base`)
      expect(r.advertisingFee).toBeCloseTo(10, 6);
      // Both deducted independently in the total.
      expect(r.totalCashFees).toBeCloseTo(19, 6);
    });

    it('affiliate commission is never assumed — omitted entirely (£0, no line) when not supplied', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
      expect(line(r, 'tiktok-affiliate-commission')).toBeUndefined();
      expect(r.advertisingFee).toBe(0);
    });

    it('affiliate commission at exactly 0% is treated the same as not supplied — no line added, no throw', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0 });
      expect(line(r, 'tiktok-affiliate-commission')).toBeUndefined();
    });

    it('affiliate basis excludes customer-paid shipping — changing shipping moves the platform commission but not the affiliate commission', () => {
      const withShipping = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        customerPaidShipping: 5,
        affiliateCommissionRate: 0.1,
      });
      const withoutShipping = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        customerPaidShipping: 0,
        affiliateCommissionRate: 0.1,
      });
      // Platform commission basis includes shipping -> commission moves.
      expect(line(withShipping, 'tiktok-commission')?.amountExVat).toBeCloseTo(9.45, 6); // 9% of 105
      expect(line(withoutShipping, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6); // 9% of 100
      // Affiliate commission basis excludes shipping entirely -> unchanged.
      expect(line(withShipping, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(10, 6);
      expect(line(withoutShipping, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(10, 6);
    });

    it('platform discount affects the two bases per their own official formulas: excluded from platform basis, subtracted from affiliate basis', () => {
      const withPlatformDiscount = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        platformDiscount: 20,
        affiliateCommissionRate: 0.1,
      });
      const withoutPlatformDiscount = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        platformDiscount: 0,
        affiliateCommissionRate: 0.1,
      });
      // Platform commission is identical either way — platform discount never enters that basis.
      expect(line(withPlatformDiscount, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6);
      expect(line(withoutPlatformDiscount, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6);
      // Affiliate commission DOES move — basis drops from £100 to £80.
      expect(line(withPlatformDiscount, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(8, 6);
      expect(line(withoutPlatformDiscount, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(10, 6);
    });

    it("a supplied, nonblank, out-of-range affiliate rate is REJECTED at the engine boundary — never silently treated as 'not supplied'", () => {
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.005 })).toThrow();
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.85 })).toThrow();
      expect(() => calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: -0.1 })).toThrow();
    });

    it('accepts the documented boundary rates 1% and 80%', () => {
      const at1pct = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.01 });
      const at80pct = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.8 });
      expect(line(at1pct, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(1, 6);
      expect(line(at80pct, 'tiktok-affiliate-commission')?.amountExVat).toBeCloseTo(80, 6);
    });

    it("the affiliate fee line's formula text accurately reflects its own basis, not the platform commission basis", () => {
      const r = calculateTikTok({
        ...base,
        soldPrice: 100,
        sellerDiscount: 10,
        platformDiscount: 10,
        customerPaidShipping: 5,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        affiliateCommissionRate: 0.1,
      });
      const formula = line(r, 'tiktok-affiliate-commission')?.formula ?? '';
      expect(formula).toContain('£80.00');
      expect(formula).not.toContain('£95.00');
      expect(formula.toLowerCase()).toContain('excludes customer-paid shipping');
    });

    it('including affiliate commission downgrades confidence to EXCLUDES_VARIABLE_FEES with a creator-VAT exclusion', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', affiliateCommissionRate: 0.1 });
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      expect(r.exclusions.some((e) => /creator/i.test(e) && /vat/i.test(e))).toBe(true);
    });
  });

  describe('discount validation: seller + platform discount must never exceed the product subtotal', () => {
    it('REJECTS combined seller + platform discounts that exceed the subtotal — a £60+£60 discount on a £100 product is not a valid order', () => {
      expect(() =>
        calculateTikTok({
          ...base,
          soldPrice: 100,
          sellerDiscount: 60,
          platformDiscount: 60, // 60 + 60 = 120 > 100
          categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        })
      ).toThrow(/exceeds the product subtotal/);
    });

    it('REJECTS a seller discount alone that exceeds the subtotal', () => {
      expect(() =>
        calculateTikTok({ ...base, soldPrice: 100, sellerDiscount: 150, platformDiscount: 0, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' })
      ).toThrow(/exceeds the product subtotal/);
    });

    it('ACCEPTS discounts exactly equal to the product subtotal — the boundary itself is valid', () => {
      const r = calculateTikTok({
        ...base,
        soldPrice: 100,
        sellerDiscount: 50,
        platformDiscount: 50, // exactly 100 = subtotal
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        affiliateCommissionRate: 0.1,
      });
      // Affiliate basis = 100 - 50 - 50 = £0 exactly — valid, not an error.
      expect(line(r, 'tiktok-affiliate-commission')?.amountExVat).toBe(0);
      // Platform basis = 100 - 50 + 0 shipping = £50, unaffected by this boundary.
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(4.5, 6); // 9% of £50
    });

    it('scales the subtotal by quantity — £120 combined discount is invalid for qty 1 but valid for qty 2', () => {
      expect(() =>
        calculateTikTok({
          ...base,
          soldPrice: 100,
          quantity: 1,
          sellerDiscount: 60,
          platformDiscount: 60,
          categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        })
      ).toThrow(/exceeds the product subtotal/);

      const r = calculateTikTok({
        ...base,
        soldPrice: 100,
        quantity: 2, // subtotal = £200
        sellerDiscount: 60,
        platformDiscount: 60, // 120 <= 200, valid
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
      });
      // Platform basis = subtotal - SELLER discount only (+ shipping, £0 here) = 200 - 60 = £140.
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo((200 - 60) * 0.09, 6);
    });

    it('does not floor or normalise an invalid order — the error is thrown, no result is ever produced', () => {
      let threw = false;
      let result: ReturnType<typeof calculateTikTok> | undefined;
      try {
        result = calculateTikTok({
          ...base,
          soldPrice: 100,
          sellerDiscount: 70,
          platformDiscount: 70,
          categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        });
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
      expect(result).toBeUndefined();
    });

    it('all valid worked examples remain unchanged by the discount guard', () => {
      const r = calculateTikTok({
        ...base,
        soldPrice: 100,
        sellerDiscount: 10,
        platformDiscount: 10,
        customerPaidShipping: 5,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
      });
      expect(r.grossRevenue).toBeCloseTo(95, 6);
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(8.55, 6);
    });
  });

  describe('VAT presentation and confidence for VAT-registered vs non-VAT-registered sellers', () => {
    it('non-VAT-registered seller: full VAT-inclusive commission is the correct cash deduction, no downgrade from this cause', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', vatProfile: 'NOT_REGISTERED' });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6);
      expect(r.confidence).toBe('EXACT_FOR_SELECTED_INPUTS');
      expect(r.exclusions.some((e) => /Platform Service Fee invoice/i.test(e))).toBe(false);
    });

    it('VAT-registered seller: commission amount is unchanged (still the full published rate, no extra 20% added), but confidence is downgraded and disclosed', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', vatProfile: 'REGISTERED' });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(9, 6); // same cash amount as NOT_REGISTERED
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      expect(r.exclusions.some((e) => /Platform Service Fee invoice/i.test(e))).toBe(true);
      // Never derives a reclaimable VAT figure without the seller's actual invoice.
      expect(r.potentiallyReclaimableVat).toBe(0);
      expect(r.vatOnFees).toBe(0);
    });

    it('VAT-registered disclosure also applies when a promotional rate is used', () => {
      const r = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        promotionalRate: 0.05,
        vatProfile: 'REGISTERED',
      });
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      expect(r.exclusions.some((e) => /Platform Service Fee invoice/i.test(e))).toBe(true);
    });
  });

  describe('other actual TikTok Shop costs (FBT/ads/storage/returns) — actual entry, no invented schedule', () => {
    it('a positive amount is included as its own line, reduces profit accordingly, and adds ASSUMPTION_DEPENDENT', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', otherActualCosts: 15 });
      expect(line(r, 'tiktok-other-actual-costs')?.amountExVat).toBeCloseTo(15, 6);
      expect(r.otherPlatformCosts).toBeCloseTo(15, 6);
      expect(r.confidence).toBe('ASSUMPTION_DEPENDENT');
      expect(r.assumptions.some((a) => /actual cash amount/i.test(a))).toBe(true);
    });

    it('zero (default) adds no line and no assumption', () => {
      const r = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', otherActualCosts: 0 });
      expect(line(r, 'tiktok-other-actual-costs')).toBeUndefined();
    });

    it('a VAT-registered seller gets an additional disclosure that VAT recovery on this entered amount is not modelled', () => {
      const registered = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        otherActualCosts: 15,
        vatProfile: 'REGISTERED',
      });
      const notRegistered = calculateTikTok({
        ...base,
        categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL',
        otherActualCosts: 15,
        vatProfile: 'NOT_REGISTERED',
      });
      expect(registered.assumptions.some((a) => /VAT recovery/i.test(a) && /not modelled/i.test(a))).toBe(true);
      expect(notRegistered.assumptions.some((a) => /VAT recovery/i.test(a) && /not modelled/i.test(a))).toBe(false);
    });
  });

  describe('seller vs actual shipping/fulfilment cost stay separate', () => {
    it('customerPaidShipping affects the commission basis; shippingCost (actual) does not', () => {
      const withShippingCost = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', shippingCost: 20 });
      const withoutShippingCost = calculateTikTok({ ...base, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', shippingCost: 0 });
      // Commission basis/commission itself is identical either way.
      expect(line(withShippingCost, 'tiktok-commission')?.amountExVat).toBeCloseTo(
        line(withoutShippingCost, 'tiktok-commission')?.amountExVat ?? NaN,
        6
      );
      // But it does reduce profit, exactly like every other platform's actual shipping cost.
      expect(withShippingCost.estimatedProfit).toBeCloseTo(withoutShippingCost.estimatedProfit - 20, 6);
      expect(withShippingCost.shippingCost).toBe(20);
    });
  });

  describe('empty, negative and invalid inputs are handled safely', () => {
    it('throws on a negative sold price rather than silently coercing it', () => {
      expect(() => calculateTikTok({ ...base, soldPrice: -5 })).toThrow();
    });

    it('throws on a negative seller discount', () => {
      expect(() => calculateTikTok({ ...base, sellerDiscount: -1 })).toThrow();
    });

    it('throws on a negative platform discount', () => {
      expect(() => calculateTikTok({ ...base, platformDiscount: -1 })).toThrow();
    });

    it('throws on a negative customer-paid shipping amount', () => {
      expect(() => calculateTikTok({ ...base, customerPaidShipping: -1 })).toThrow();
    });

    it('throws on a negative "other actual costs" amount', () => {
      expect(() => calculateTikTok({ ...base, otherActualCosts: -1 })).toThrow();
    });

    it('throws on an invalid (zero/fractional) quantity', () => {
      expect(() => calculateTikTok({ ...base, quantity: 0 })).toThrow();
      expect(() => calculateTikTok({ ...base, quantity: 1.5 })).toThrow();
    });

    it('a manual category rate of exactly 0 is never applied — treated as "not supplied"', () => {
      const r = calculateTikTok({ ...base, categoryId: UNSUPPORTED_CATEGORY_ID, manualCategoryRate: 0 });
      expect(line(r, 'tiktok-commission')).toBeUndefined();
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a negative manual category rate is never applied', () => {
      const r = calculateTikTok({ ...base, categoryId: UNSUPPORTED_CATEGORY_ID, manualCategoryRate: -0.1 });
      expect(line(r, 'tiktok-commission')).toBeUndefined();
    });

    it('zero sold price, zero everything -> zero commission, no throw', () => {
      const r = calculateTikTok({ ...base, soldPrice: 0, itemCost: 0, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBe(0);
      expect(r.estimatedProfit).toBe(0);
    });
  });

  describe('quantity multiplies the item subtotal correctly', () => {
    it('3 units at £100 each, 9% category -> £27 commission', () => {
      const r = calculateTikTok({ ...base, soldPrice: 100, quantity: 3, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(27, 6);
    });
  });

  describe('currency rounding remains correct', () => {
    it('sub-penny fee lines are shown unrounded (e.g. £0.109 on a decimal basis), matching the app-wide convention', () => {
      // 3 units at £3.33, quantity multiplies BEFORE the rate is applied — a case likely to expose float error.
      const r = calculateTikTok({ ...base, soldPrice: 3.33, quantity: 3, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
      // 3.33 * 3 = 9.99; 9% of 9.99 = 0.8991 exactly.
      expect(line(r, 'tiktok-commission')?.amountExVat).toBeCloseTo(0.8991, 10);
    });

    it('formatGBP rounds the headline total to the nearest penny, round-half-up', () => {
      const r = calculateTikTok({ ...base, soldPrice: 100, categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL' });
      expect(formatGBP(r.estimatedProfit)).toBe('£91.00');
    });
  });
});
