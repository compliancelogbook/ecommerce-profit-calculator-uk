// V1 is GBP-only (UK seller jurisdiction) — see AGENTS/plan notes on why the
// old multi-currency country switcher was removed rather than kept as decor.
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

/** For the sub-penny "raw" breakdown figures the brief's fixtures use (e.g. £0.105). */
export function formatGBPRaw(amount: number, decimals = 3): string {
  return `£${amount.toFixed(decimals)}`;
}

export function formatPercent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}
