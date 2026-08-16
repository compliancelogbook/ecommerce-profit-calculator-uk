import { describe, expect, it } from 'vitest';
import { worstConfidence } from '../confidence';

describe('worstConfidence precedence', () => {
  it('defaults to EXACT_FOR_SELECTED_INPUTS with no signals', () => {
    expect(worstConfidence([])).toBe('EXACT_FOR_SELECTED_INPUTS');
  });
  it('a single EXACT signal stays EXACT', () => {
    expect(worstConfidence(['EXACT_FOR_SELECTED_INPUTS'])).toBe('EXACT_FOR_SELECTED_INPUTS');
  });
  it('ASSUMPTION_DEPENDENT outranks EXACT', () => {
    expect(worstConfidence(['EXACT_FOR_SELECTED_INPUTS', 'ASSUMPTION_DEPENDENT'])).toBe('ASSUMPTION_DEPENDENT');
  });
  it('EXCLUDES_VARIABLE_FEES outranks both EXACT and ASSUMPTION_DEPENDENT', () => {
    expect(worstConfidence(['EXACT_FOR_SELECTED_INPUTS', 'ASSUMPTION_DEPENDENT', 'EXCLUDES_VARIABLE_FEES'])).toBe('EXCLUDES_VARIABLE_FEES');
    expect(worstConfidence(['ASSUMPTION_DEPENDENT', 'EXCLUDES_VARIABLE_FEES'])).toBe('EXCLUDES_VARIABLE_FEES');
  });
  it('order of signals does not matter — always takes the worst', () => {
    expect(worstConfidence(['EXCLUDES_VARIABLE_FEES', 'EXACT_FOR_SELECTED_INPUTS'])).toBe('EXCLUDES_VARIABLE_FEES');
  });
});
