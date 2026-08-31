import { describe, expect, it } from 'vitest';
import { TIKTOK_CATEGORIES, TIKTOK_SOURCE } from '../tiktok.fees';

// Dataset integrity: the same claims independently audited against the
// source workbook before a single row was encoded (see scripts/
// generate-tiktok-data.py, which re-asserts every one of these at
// generation time and refuses to emit a file if any fails).
describe('TikTok Shop UK commission dataset integrity', () => {
  it('contains exactly 343 rules', () => {
    expect(TIKTOK_CATEGORIES.length).toBe(343);
  });

  it('contains exactly 127 rules at 5% and 216 rules at 9%', () => {
    const at5 = TIKTOK_CATEGORIES.filter((c) => c.rate === 0.05).length;
    const at9 = TIKTOK_CATEGORIES.filter((c) => c.rate === 0.09).length;
    expect(at5).toBe(127);
    expect(at9).toBe(216);
    expect(at5 + at9).toBe(TIKTOK_CATEGORIES.length);
  });

  it('only 0.05 and 0.09 occur as rates - no other value', () => {
    const rates = new Set(TIKTOK_CATEGORIES.map((c) => c.rate));
    expect(rates).toEqual(new Set([0.05, 0.09]));
  });

  it('has no duplicate category/subcategory combinations', () => {
    const separator = String.fromCharCode(31);
    const combos = TIKTOK_CATEGORIES.map((c) => c.category + separator + c.subcategory);
    expect(new Set(combos).size).toBe(combos.length);
  });

  it('has no duplicate generated ids', () => {
    const ids = TIKTOK_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no blank category, subcategory or id', () => {
    for (const c of TIKTOK_CATEGORIES) {
      expect(c.category.trim(), c.id).not.toBe('');
      expect(c.subcategory.trim(), c.id).not.toBe('');
      expect(c.id.trim()).not.toBe('');
    }
  });

  it('every rule is individually audit-verified, sourced, and carries the VAT-inclusive condition', () => {
    for (const c of TIKTOK_CATEGORIES) {
      expect(c.source.verificationStatus, c.id).toBe('AUDIT_VERIFIED');
      expect(c.source.url, c.id).toMatch(/^https:\/\/seller-uk\.tiktok\.com\//);
      expect(c.source.conditions, c.id).toMatch(/inclusive of applicable VAT/i);
    }
  });

  it('preserves the source workbook literal Quartz Watches spelling without silently correcting it, and offers a tested display alias', () => {
    const row = TIKTOK_CATEGORIES.find((c) => c.id === 'PRE_OWNED__QUARTZ_WATCHES');
    expect(row).toBeDefined();
    expect(row!.category).toBe('Pre-Owned');
    // The literal source character is U+01EA, not a plain ASCII 'Q'.
    expect(row!.subcategory.codePointAt(0)).toBe(0x01ea);
    expect(row!.subcategory.length).toBe('Quartz Watches'.length);
    expect(row!.subcategory.slice(1)).toBe('uartz Watches');
    expect(row!.subcategoryDisplay).toBe('Quartz Watches');
    expect(row!.rate).toBe(0.09);
  });

  it('TIKTOK_SOURCE is shared by every rule (single source of truth, not duplicated per row)', () => {
    expect(TIKTOK_CATEGORIES.every((c) => c.source === TIKTOK_SOURCE)).toBe(true);
  });

  it('the Household Appliances flat 5% category and a spot-checked 9% category resolve as expected', () => {
    const household = TIKTOK_CATEGORIES.find((c) => c.id === 'HOUSEHOLD_APPLIANCES__ALL');
    expect(household?.rate).toBe(0.05);
    const automotive = TIKTOK_CATEGORIES.find((c) => c.id === 'AUTOMOTIVE_MOTORCYCLE__ALL');
    expect(automotive?.rate).toBe(0.09);
  });
});
