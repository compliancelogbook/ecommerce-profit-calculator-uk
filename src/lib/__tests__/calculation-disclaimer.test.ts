import { describe, expect, it } from 'vitest';
import { CALCULATION_DISCLAIMER } from '../calculation-disclaimer';
import { EDUCATIONAL_DISCLAIMER } from '../uk-tax-guide/content';

describe('shared calculation disclaimer', () => {
  it('states results are an estimate based on entered details and settings', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/estimate/i);
    expect(CALCULATION_DISCLAIMER).toMatch(/entered/i);
  });

  it('states marketplace fees/policies can change', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/can change/i);
  });

  it('states a variable/unknown/excluded charge is never silently treated as zero', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/never silently treated as £0/i);
  });

  it('tells the user to verify material decisions with the marketplace and, where appropriate, an adviser', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/verify/i);
    expect(CALCULATION_DISCLAIMER).toMatch(/qualified adviser/i);
  });

  it('states EasyFeezy does not provide personal tax, accounting, financial or legal advice', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/does not provide personal tax, accounting, financial or legal advice/i);
  });

  it('is distinct from the UK Seller Tax Guide\'s own educational disclaimer, not a copy of it', () => {
    expect(CALCULATION_DISCLAIMER).not.toBe(EDUCATIONAL_DISCLAIMER);
  });

  it('never claims to be a guarantee, quote or invoice', () => {
    expect(CALCULATION_DISCLAIMER).toMatch(/not a quote, invoice or guarantee/i);
  });
});
