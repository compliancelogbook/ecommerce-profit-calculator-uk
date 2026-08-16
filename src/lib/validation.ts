// UI-boundary input validation. Nothing here silently coerces a bad value
// into 0 or 1 — every parser either returns a valid value or a specific
// error string, and callers must not proceed to a calculation on an error.
// (Money fields alone treat a truly blank field as £0, since that's a
// legitimate, common value for e.g. shipping — but a negative or malformed
// value is always rejected, never coerced.)

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function toNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // Reject forms Number() is too permissive about (e.g. '', ' ', 'Infinity', hex).
  if (!/^-?\d*\.?\d+$/.test(trimmed)) return NaN;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

/** Money-like amounts (sale price, item cost, shipping): blank = £0, negative/malformed = error. */
export function parseNonNegativeAmount(raw: string, fieldLabel: string): ValidationResult<number> {
  const n = toNumber(raw);
  if (n === null) return { ok: true, value: 0 };
  if (Number.isNaN(n)) return { ok: false, error: `${fieldLabel} must be a valid number.` };
  if (n < 0) return { ok: false, error: `${fieldLabel} cannot be negative.` };
  return { ok: true, value: n };
}

/** Quantity: must be a whole number ≥ 1. Never silently defaults to 1. */
export function parsePositiveWholeQuantity(raw: string): ValidationResult<number> {
  const n = toNumber(raw);
  if (n === null) return { ok: false, error: 'Quantity is required.' };
  if (Number.isNaN(n)) return { ok: false, error: 'Quantity must be a whole number.' };
  if (!Number.isInteger(n)) return { ok: false, error: 'Quantity must be a whole number — fractional units are not supported.' };
  if (n < 1) return { ok: false, error: 'Quantity must be at least 1.' };
  return { ok: true, value: n };
}

/** An optional whole-number volume field (e.g. expected monthly orders). Blank is valid (means "not provided"). */
export function parseOptionalPositiveInteger(raw: string, fieldLabel: string): ValidationResult<number | null> {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: null };
  const n = toNumber(raw);
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n < 1) {
    return { ok: false, error: `${fieldLabel} must be a whole number of at least 1, or left blank.` };
  }
  return { ok: true, value: n };
}

/**
 * A manual, user-entered category percentage (eBay/Amazon "Other" fallback).
 * Must be present, numeric, strictly greater than 0 (a 0% referral/FVF rate
 * is never a real supported rate for this fallback — silently accepting it
 * would misrepresent an excluded fee as a calculated one), and capped at a
 * sanity ceiling well above any real published category rate.
 */
export function parseManualCategoryRate(raw: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: 'Enter a rate, or leave the fee excluded rather than guessing.' };
  const n = toNumber(raw);
  if (n === null || Number.isNaN(n)) return { ok: false, error: 'Rate must be a valid number.' };
  if (n <= 0) return { ok: false, error: 'Rate must be greater than 0% — 0% is not a supported fallback value.' };
  if (n > 60) return { ok: false, error: 'Rate looks implausibly high (over 60%) — double-check it.' };
  return { ok: true, value: n / 100 };
}

/** A positive FX rate (USD->GBP), with a generous sanity ceiling to catch fat-finger errors (e.g. "75" instead of "0.75"). */
export function parsePositiveFxRate(raw: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: 'Exchange rate is required.' };
  const n = toNumber(raw);
  if (n === null || Number.isNaN(n)) return { ok: false, error: 'Exchange rate must be a valid number.' };
  if (n <= 0) return { ok: false, error: 'Exchange rate must be greater than 0.' };
  if (n > 10) return { ok: false, error: 'Exchange rate looks implausibly high.' };
  return { ok: true, value: n };
}

/** A processor percentage rate: 0 is a legitimate value (some processors genuinely charge 0% + a fixed fee), negative/malformed/absurd are not. Blank = not set (0). */
export function parseNonNegativePercent(raw: string, fieldLabel: string, max = 100): ValidationResult<number> {
  const n = toNumber(raw);
  if (n === null) return { ok: true, value: 0 };
  if (Number.isNaN(n)) return { ok: false, error: `${fieldLabel} must be a valid number.` };
  if (n < 0) return { ok: false, error: `${fieldLabel} cannot be negative.` };
  if (n > max) return { ok: false, error: `${fieldLabel} looks implausibly high (max ${max}%).` };
  return { ok: true, value: n / 100 };
}

/** A fixed fee amount (e.g. processor's fixed per-transaction charge): 0 is legitimate, negative/malformed are not. Blank = £0. */
export function parseNonNegativeFixedFee(raw: string, fieldLabel: string): ValidationResult<number> {
  return parseNonNegativeAmount(raw, fieldLabel);
}
