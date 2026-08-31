// Hand-maintained (NOT auto-generated) TikTok Shop UK policy source
// citations — distinct from the auto-generated commission-rate dataset in
// tiktok.fees.ts. These describe general VAT-treatment facts, not
// per-category rates, so they don't belong in the generator's output.
import type { SourceRef } from './types';

const META = { platform: 'TIKTOK' as const, sellerMarket: 'GB' as const, currency: 'GBP' as const };

/** How affiliate/creator commission VAT is treated — depends on the creator's own VAT status and invoicing. */
export const TIKTOK_AFFILIATE_VAT_SOURCE: SourceRef = {
  ...META,
  feeType: 'affiliate_commission_vat_treatment',
  formula: "Affiliate/creator commission VAT depends on the creator's own VAT status and invoicing.",
  effectiveDate: null,
  url: 'https://seller-uk.tiktok.com/university/essay?knowledge_id=7753826522334978',
  verifiedAt: '2026-08-31',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'A VAT-registered creator must issue an invoice, and VAT may apply on that invoice — this is not modelled or estimated here; confirm the actual VAT treatment via the creator\'s own invoice.',
};

/** How the platform commission's embedded VAT is treated — the published rate is VAT-inclusive, not itemised. */
export const TIKTOK_COMMISSION_VAT_SOURCE: SourceRef = {
  ...META,
  feeType: 'commission_vat_treatment',
  formula: 'The published commission rate is VAT-inclusive; the embedded VAT component is not separated or estimated by this calculator.',
  effectiveDate: null,
  url: 'https://seller-uk.tiktok.com/university/essay?knowledge_id=7753824408913665',
  verifiedAt: '2026-08-31',
  verificationStatus: 'AUDIT_VERIFIED',
  notes:
    'Cross-referenced against knowledge_id=6837879071016706 and HMRC guidance (gov.uk/charge-reclaim-record-vat/reclaim-vat-business-expenses). VAT-registered sellers should use TikTok\'s Platform Service Fee invoice to determine any recoverable VAT component — this calculator never derives a reclaimable VAT amount without one.',
};
