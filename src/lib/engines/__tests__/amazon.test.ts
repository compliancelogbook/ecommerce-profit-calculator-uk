import { describe, expect, it } from 'vitest';
import { calculateAmazon, type AmazonInput } from '../amazon';
import { AMAZON_CATEGORIES } from '../../../data/amazon.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../../data/types';

const base: AmazonInput = {
  itemPrice: 30,
  itemCost: 0,
  deliveryCharge: 0,
  shippingCost: 0,
  quantity: 1,
  sellerPlan: 'INDIVIDUAL',
  categoryId: 'JEWELLERY',
  vatProfile: 'NOT_REGISTERED',
};

function line(r: ReturnType<typeof calculateAmazon>, id: string) {
  return r.feeLines.find((f) => f.id === id)!;
}

describe('Amazon UK FBM acceptance tests', () => {
  it('A01: Individual seller, Jewellery, £30 -> referral £6.00 + individual fee £0.75 = £6.75 before VAT', () => {
    const r = calculateAmazon(base);
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(6.0, 6);
    expect(line(r, 'amazon-individual-fee').amountExVat).toBeCloseTo(0.75, 6);
    const exVatTotal = line(r, 'amazon-referral').amountExVat + line(r, 'amazon-individual-fee').amountExVat;
    expect(exVatTotal).toBeCloseTo(6.75, 6);
  });

  it('A02: Professional, £25/mo, 100 expected monthly units -> £0.25/unit allocated', () => {
    const r = calculateAmazon({ ...base, sellerPlan: 'PROFESSIONAL', expectedMonthlyUnits: 100 });
    expect(r.allocatedSubscriptionCost).toBeCloseTo(0.25, 6);
  });

  it('A03: Home, £15 -> 8% (within minimum-fee rules)', () => {
    const r = calculateAmazon({ ...base, categoryId: 'HOME', itemPrice: 15 });
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(15 * 0.08, 6);
  });

  it('A04: Home, £30 -> 15% (whole-amount threshold, not blended)', () => {
    const r = calculateAmazon({ ...base, categoryId: 'HOME', itemPrice: 30 });
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(30 * 0.15, 6);
  });

  it('Home boundary: exactly £20 falls entirely in the first (8%) bracket', () => {
    const r = calculateAmazon({ ...base, categoryId: 'HOME', itemPrice: 20 });
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(20 * 0.08, 6);
  });

  it('Beauty is also whole-amount threshold, matching Home\'s confirmed pattern', () => {
    const within = calculateAmazon({ ...base, categoryId: 'BEAUTY', itemPrice: 10 });
    expect(line(within, 'amazon-referral').amountExVat).toBeCloseTo(10 * 0.08, 6);

    const above = calculateAmazon({ ...base, categoryId: 'BEAUTY', itemPrice: 20 });
    // Whole-amount: 20 * 0.15 = 3.00, NOT a blend (10*0.08 + 10*0.15 = 2.30).
    expect(line(above, 'amazon-referral').amountExVat).toBeCloseTo(20 * 0.15, 6);
  });

  it('A05: Jewellery, £300 -> 20% on first £225, 5% on remaining £75', () => {
    const r = calculateAmazon({ ...base, categoryId: 'JEWELLERY', itemPrice: 300 });
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(225 * 0.2 + 75 * 0.05, 6);
  });

  it('A06: Everything Else, £100 -> £15.00', () => {
    const r = calculateAmazon({ ...base, categoryId: 'EVERYTHING_ELSE', itemPrice: 100 });
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(15.0, 6);
  });

  it('A07: calculated percentage below £0.25 minimum -> minimum fee applied', () => {
    const r = calculateAmazon({ ...base, categoryId: 'EVERYTHING_ELSE', itemPrice: 1 });
    expect(1 * 0.15).toBeLessThan(0.25);
    expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(0.25, 6);
  });

  it('Unsupported category is never silently guessed', () => {
    const r = calculateAmazon({ ...base, categoryId: 'SOME_UNKNOWN_CATEGORY' });
    expect(line(r, 'amazon-referral').amountExVat).toBe(0);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('VAT on referral fees is explicitly excluded, not guessed', () => {
    const r = calculateAmazon(base);
    expect(line(r, 'amazon-referral').vatUnconfirmed).toBe(true);
    expect(r.exclusions.some((e) => e.includes('VAT on referral fees'))).toBe(true);
  });

  describe('2026-08-16 audit: confidence precedence', () => {
    it('never reports EXACT_FOR_SELECTED_INPUTS, since referral-fee VAT is always excluded', () => {
      const r = calculateAmazon({ ...base, categoryId: 'EVERYTHING_ELSE' });
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('an AUTOMATED_UNVERIFIED category still surfaces as at least ASSUMPTION_DEPENDENT-worthy information, but overall confidence stays EXCLUDES_VARIABLE_FEES (worst-of)', () => {
      const r = calculateAmazon({ ...base, categoryId: 'BOOKS', itemPrice: 20 });
      expect(r.assumptions.some((a) => a.includes('automated fetch'))).toBe(true);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });
  });

  describe('2026-08-16 audit: Automotive & Powersports corrected to marginal tiering', () => {
    it('AUTOMOTIVE_POWERSPORTS is marginal (portion-based), not whole-amount', () => {
      const r = calculateAmazon({ ...base, categoryId: 'AUTOMOTIVE_POWERSPORTS', itemPrice: 100 });
      // 15% on the portion up to £45, 9% on the portion above -> 45*0.15 + 55*0.09 = 6.75 + 4.95 = 11.70
      // A whole-amount (THRESHOLD_FLAT) reading would instead give 100 * 0.09 = 9.00.
      expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(45 * 0.15 + 55 * 0.09, 6);
      expect(line(r, 'amazon-referral').amountExVat).not.toBeCloseTo(100 * 0.09, 2);
    });

    it('boundary: exactly £45 falls entirely in the first tier', () => {
      const r = calculateAmazon({ ...base, categoryId: 'AUTOMOTIVE_POWERSPORTS', itemPrice: 45 });
      expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(45 * 0.15, 6);
    });
  });

  describe('2026-08-16 audit: categories with an unverified threshold mechanic were removed, not guessed', () => {
    const removedIds = [
      'BABY_PRODUCTS',
      'BABY_PUSHCHAIRS_SAFETY_EQUIPMENT',
      'REUSABLE_WORK_SAFETY_GLOVES',
      'CLOTHING_ACCESSORIES',
      'ELECTRONIC_ACCESSORIES',
      'PRINTER_SCANNER_ACCESSORIES',
      'FURNITURE',
      'GROCERY_GOURMET',
      'PET_CLOTHING_FOOD',
      'VITAMINS_MINERALS_SUPPLEMENTS',
    ];

    it.each(removedIds)('%s is no longer an auto-calculable category', (id) => {
      expect(AMAZON_CATEGORIES.find((c) => c.id === id)).toBeUndefined();
      const r = calculateAmazon({ ...base, categoryId: id });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('every remaining category has an independently justified schedule kind (SPEC_VERIFIED, AUDIT_VERIFIED, or FLAT AUTOMATED_UNVERIFIED)', () => {
      for (const cat of AMAZON_CATEGORIES) {
        const isFlatOrJustified =
          cat.schedule.kind === 'FLAT' || cat.source.verificationStatus === 'SPEC_VERIFIED' || cat.source.verificationStatus === 'AUDIT_VERIFIED';
        expect(isFlatOrJustified, `${cat.id} has an unjustified multi-bracket schedule`).toBe(true);
      }
    });
  });

  describe('2026-08-16 audit: manual category rate never silently becomes 0%', () => {
    const unsupported = { ...base, categoryId: UNSUPPORTED_CATEGORY_ID };

    it('missing manual rate excludes the fee', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: undefined });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a 0% manual rate is rejected', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: 0 });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
    });

    it('a negative manual rate is rejected', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: -0.1 });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
    });

    it('a malformed manual rate is rejected', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: NaN });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
    });

    it('an implausibly high manual rate (>100%) is rejected', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: 2 });
      expect(line(r, 'amazon-referral').amountExVat).toBe(0);
    });

    it('a valid manual rate is accepted and marked ASSUMPTION_DEPENDENT-worthy', () => {
      const r = calculateAmazon({ ...unsupported, manualCategoryRate: 0.2, itemPrice: 50 });
      expect(line(r, 'amazon-referral').amountExVat).toBeCloseTo(10, 6);
      expect(r.assumptions.some((a) => a.includes('manually entered'))).toBe(true);
    });
  });

  it('rejects negative and non-integer/zero inputs at the engine boundary', () => {
    expect(() => calculateAmazon({ ...base, itemPrice: -1 })).toThrow();
    expect(() => calculateAmazon({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateAmazon({ ...base, quantity: 1.5 })).toThrow();
  });
});
