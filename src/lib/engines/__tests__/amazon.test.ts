import { describe, expect, it } from 'vitest';
import { calculateAmazon, type AmazonInput } from '../amazon';

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
});
