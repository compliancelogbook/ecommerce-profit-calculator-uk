import { describe, expect, it } from 'vitest';
import { calculateEbay, type EbayInput } from '../ebay';

const base: EbayInput = {
  itemPrice: 30,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  categoryId: 'JEWELLERY_WATCHES',
  region: 'DOMESTIC',
  currencyConversionSelected: false,
  topRatedPremiumService: false,
  vatProfile: 'NOT_REGISTERED',
};

function line(r: ReturnType<typeof calculateEbay>, id: string) {
  return r.feeLines.find((f) => f.id === id)!;
}

describe('eBay UK Business acceptance tests', () => {
  it('EB01: Jewellery & Watches, £30, domestic, no top-rated -> raw base fees £4.975', () => {
    const r = calculateEbay(base);
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(4.47, 6);
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
    expect(r.regulatoryFee).toBeCloseTo(0.105, 6);
    const raw = line(r, 'ebay-variable-fvf').amountExVat + line(r, 'ebay-per-order').amountExVat + r.regulatoryFee;
    expect(raw).toBeCloseTo(4.975, 6);
  });

  it('EB02: £10 sale -> per-order fee £0.30', () => {
    const r = calculateEbay({ ...base, itemPrice: 10 });
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6);
  });

  it('EB03: £10.01 sale -> per-order fee £0.40', () => {
    const r = calculateEbay({ ...base, itemPrice: 10.01 });
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
  });

  it("EB04: Women's Bags & Handbags, £1000 -> 12.9% on first £800, 7% on £200 above", () => {
    const r = calculateEbay({ ...base, categoryId: 'WOMENS_BAGS_HANDBAGS', itemPrice: 1000 });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(800 * 0.129 + 200 * 0.07, 6);
  });

  it('EB05: Jewellery & Watches, £1200 -> 14.9% on first £1000, 4% on £200 above', () => {
    const r = calculateEbay({ ...base, itemPrice: 1200 });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 200 * 0.04, 6);
  });

  it('EB06: £100 Eurozone/Northern Europe -> international fee £1.05', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'EU_NORTHERN_EUROPE' });
    expect(r.internationalFee).toBeCloseTo(1.05, 6);
  });

  it('EB07: £100 US/Canada -> international fee £1.80', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'US_CANADA' });
    expect(r.internationalFee).toBeCloseTo(1.8, 6);
  });

  it('EB08: £100 Other -> international fee £2.00', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'OTHER' });
    expect(r.internationalFee).toBeCloseTo(2.0, 6);
  });

  it('EB09: £100 basis, currency conversion selected -> £2.50', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, currencyConversionSelected: true });
    expect(r.currencyConversionFee).toBeCloseTo(2.5, 6);
  });

  it('EB10: Top Rated Premium Service reduces only the variable FVF by 10%', () => {
    const without = calculateEbay(base);
    const withDiscount = calculateEbay({ ...base, topRatedPremiumService: true });
    expect(line(withDiscount, 'ebay-variable-fvf').amountExVat).toBeCloseTo(line(without, 'ebay-variable-fvf').amountExVat * 0.9, 6);
    expect(line(withDiscount, 'ebay-per-order').amountExVat).toBeCloseTo(line(without, 'ebay-per-order').amountExVat, 6);
    expect(withDiscount.regulatoryFee).toBeCloseTo(without.regulatoryFee, 6);
  });

  it('Unsupported category is never silently guessed', () => {
    const r = calculateEbay({ ...base, categoryId: 'SOME_UNKNOWN_CATEGORY' });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBe(0);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    expect(r.exclusions.some((e) => e.includes('not in the verified'))).toBe(true);
  });
});
