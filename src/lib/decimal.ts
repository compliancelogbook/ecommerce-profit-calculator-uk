import Decimal from 'decimal.js';

// Financial arithmetic boundary: everywhere else in the app deals in plain
// `number`. Only this module (and the engines that use it internally) touch
// Decimal directly, so calculation code never accumulates raw JS float error
// and rounding only ever happens at an explicit, named boundary.

export type Money = Decimal;

export function money(value: number | string): Money {
  return new Decimal(value);
}

export const ZERO: Money = new Decimal(0);

/** Percentage of an amount. `rate` is a decimal fraction, e.g. 0.149 for 14.9%. */
export function percentOf(amount: Money, rate: number): Money {
  return amount.times(rate);
}

/** Round to whole pennies (2dp) using standard round-half-up — the ONLY place
 *  rounding should happen before a value reaches display. */
export function roundToPennies(amount: Money): number {
  return amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/** Raw, unrounded value as a plain number — for internal reconciliation and
 *  for the sub-penny breakdown figures the brief's acceptance tests expect
 *  (e.g. £30 x 0.35% = £0.105). Never shown as a final headline total. */
export function toRawNumber(amount: Money): number {
  return amount.toNumber();
}

export function sum(values: Money[]): Money {
  return values.reduce((acc, v) => acc.plus(v), ZERO);
}
