import { describe, expect, it } from 'vitest';
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parseNonNegativeFixedFee,
  parseNonNegativePercent,
  parseOptionalAffiliateRate,
  parseOptionalPositiveInteger,
  parsePositiveFxRate,
  parsePositiveWholeQuantity,
} from '../validation';

describe('parseNonNegativeAmount', () => {
  it('treats blank as £0', () => {
    expect(parseNonNegativeAmount('', 'x')).toEqual({ ok: true, value: 0 });
    expect(parseNonNegativeAmount('   ', 'x')).toEqual({ ok: true, value: 0 });
  });
  it('accepts a valid non-negative number', () => {
    expect(parseNonNegativeAmount('19.99', 'x')).toEqual({ ok: true, value: 19.99 });
    expect(parseNonNegativeAmount('0', 'x')).toEqual({ ok: true, value: 0 });
  });
  it('rejects negative values', () => {
    const r = parseNonNegativeAmount('-1', 'Sold price');
    expect(r.ok).toBe(false);
  });
  it('rejects malformed values', () => {
    for (const bad of ['abc', '1.2.3', '1e', 'NaN', 'Infinity']) {
      expect(parseNonNegativeAmount(bad, 'x').ok).toBe(false);
    }
  });
});

describe('parsePositiveWholeQuantity', () => {
  it('rejects blank (never silently defaults to 1)', () => {
    expect(parsePositiveWholeQuantity('').ok).toBe(false);
  });
  it('rejects zero and negative', () => {
    expect(parsePositiveWholeQuantity('0').ok).toBe(false);
    expect(parsePositiveWholeQuantity('-2').ok).toBe(false);
  });
  it('rejects fractional quantities', () => {
    expect(parsePositiveWholeQuantity('1.5').ok).toBe(false);
  });
  it('rejects malformed input', () => {
    expect(parsePositiveWholeQuantity('abc').ok).toBe(false);
  });
  it('accepts a valid whole number', () => {
    expect(parsePositiveWholeQuantity('3')).toEqual({ ok: true, value: 3 });
  });
});

describe('parseManualCategoryRate', () => {
  it('rejects blank — never silently becomes 0%', () => {
    expect(parseManualCategoryRate('').ok).toBe(false);
  });
  it('rejects malformed input', () => {
    expect(parseManualCategoryRate('abc').ok).toBe(false);
  });
  it('rejects exactly 0 — not a supported fallback value', () => {
    expect(parseManualCategoryRate('0').ok).toBe(false);
  });
  it('rejects negative rates', () => {
    expect(parseManualCategoryRate('-5').ok).toBe(false);
  });
  it('rejects implausibly high rates', () => {
    expect(parseManualCategoryRate('75').ok).toBe(false);
  });
  it('accepts a plausible positive rate and returns it as a fraction', () => {
    expect(parseManualCategoryRate('12.5')).toEqual({ ok: true, value: 0.125 });
  });
});

describe('parsePositiveFxRate', () => {
  it('rejects blank, zero, negative and implausibly high', () => {
    expect(parsePositiveFxRate('').ok).toBe(false);
    expect(parsePositiveFxRate('0').ok).toBe(false);
    expect(parsePositiveFxRate('-0.5').ok).toBe(false);
    expect(parsePositiveFxRate('750').ok).toBe(false);
  });
  it('accepts a plausible rate', () => {
    expect(parsePositiveFxRate('0.75')).toEqual({ ok: true, value: 0.75 });
  });
});

describe('parseNonNegativePercent (processor rate)', () => {
  it('allows blank and 0 (a processor can legitimately charge 0%)', () => {
    expect(parseNonNegativePercent('', 'x')).toEqual({ ok: true, value: 0 });
    expect(parseNonNegativePercent('0', 'x')).toEqual({ ok: true, value: 0 });
  });
  it('rejects negative', () => {
    expect(parseNonNegativePercent('-1', 'x').ok).toBe(false);
  });
});

describe('parseNonNegativeFixedFee', () => {
  it('allows blank and 0', () => {
    expect(parseNonNegativeFixedFee('', 'x')).toEqual({ ok: true, value: 0 });
  });
  it('rejects negative', () => {
    expect(parseNonNegativeFixedFee('-0.2', 'x').ok).toBe(false);
  });
});

describe('parseOptionalPositiveInteger', () => {
  it('blank means "not provided"', () => {
    expect(parseOptionalPositiveInteger('', 'x')).toEqual({ ok: true, value: null });
  });
  it('rejects zero, negative and fractional when provided', () => {
    expect(parseOptionalPositiveInteger('0', 'x').ok).toBe(false);
    expect(parseOptionalPositiveInteger('-5', 'x').ok).toBe(false);
    expect(parseOptionalPositiveInteger('1.5', 'x').ok).toBe(false);
  });
  it('accepts a valid whole number', () => {
    expect(parseOptionalPositiveInteger('100', 'x')).toEqual({ ok: true, value: 100 });
  });
});

describe('parseOptionalAffiliateRate', () => {
  it('blank means "no affiliate arrangement applies" — valid, not an error', () => {
    expect(parseOptionalAffiliateRate('')).toEqual({ ok: true, value: null });
    expect(parseOptionalAffiliateRate('   ')).toEqual({ ok: true, value: null });
  });
  it('exactly 0 is treated the same as blank', () => {
    expect(parseOptionalAffiliateRate('0')).toEqual({ ok: true, value: null });
  });
  it("rejects a value below TikTok's documented 1% floor", () => {
    expect(parseOptionalAffiliateRate('0.5').ok).toBe(false);
  });
  it("rejects a value above TikTok's documented 80% ceiling", () => {
    expect(parseOptionalAffiliateRate('81').ok).toBe(false);
    expect(parseOptionalAffiliateRate('100').ok).toBe(false);
  });
  it('accepts the documented boundary values 1 and 80', () => {
    expect(parseOptionalAffiliateRate('1')).toEqual({ ok: true, value: 0.01 });
    expect(parseOptionalAffiliateRate('80')).toEqual({ ok: true, value: 0.8 });
  });
  it('accepts a valid value within range, converted to a fraction', () => {
    expect(parseOptionalAffiliateRate('10')).toEqual({ ok: true, value: 0.1 });
  });
  it('rejects malformed input', () => {
    for (const bad of ['abc', '1.2.3', 'NaN', 'Infinity']) {
      expect(parseOptionalAffiliateRate(bad).ok).toBe(false);
    }
  });
  it('rejects negative values', () => {
    expect(parseOptionalAffiliateRate('-5').ok).toBe(false);
  });
});
