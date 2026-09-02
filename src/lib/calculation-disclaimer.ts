// Single shared calculation disclaimer, rendered by ResultsPanel — the one
// component every marketplace panel (Shopify/Etsy/eBay/Amazon/TikTok Shop)
// renders its result through — so this is centralised by construction, not
// copy-pasted per platform. This is distinct from, and does not weaken or
// duplicate, the UK Seller Tax Guide's own EDUCATIONAL_DISCLAIMER
// (src/lib/uk-tax-guide/content.ts), which addresses personal tax guidance
// specifically; this one addresses calculator results specifically.
export const CALCULATION_DISCLAIMER =
  'These results are an estimate based on the transaction details and settings you entered — not a quote, invoice or guarantee. Marketplace fees, thresholds, promotions, VAT treatment and other policies can change at any time. A fee that is variable, unknown or not yet verified is disclosed above as an assumption or exclusion — it is never silently treated as £0. Before making a material decision, verify the relevant marketplace’s current terms and, where appropriate, speak to a qualified adviser. EasyFeezy does not provide personal tax, accounting, financial or legal advice.';
