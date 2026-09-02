// Source metadata for the Privacy Policy and Terms of Use — official
// registers, legislation and platform documentation only, fetched and
// checked directly before any legal-page copy was written. Two ICO pages
// returned HTTP 403 on direct automated fetch (a known, disclosed
// limitation of this environment — the same pattern already documented for
// Etsy/eBay elsewhere in this codebase); those were instead verified via
// their own indexed search-result text, which is noted per entry below.

export interface LegalSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  /** ISO date this source was actually checked against the copy it supports. */
  dateVerified: string;
  /** What this source establishes. */
  claim: string;
  /** Set when the source could only be verified via indexed search-result text, not a direct fetch. */
  verifiedVia?: string;
}

export const LEGAL_SOURCES = {
  COMPANIES_HOUSE_REGISTER: {
    id: 'companies-house-register',
    title: 'Company information — COMPLIANCE LOGBOOK LTD (16932013)',
    url: 'https://find-and-update.company-information.service.gov.uk/company/16932013',
    publisher: 'Companies House (GOV.UK)',
    dateVerified: '2026-09-02',
    claim: 'Confirms company name, active status, company number and current registered office address.',
  },
  TRADING_DISCLOSURES_REGULATIONS: {
    id: 'trading-disclosures-regulations-2008',
    title: 'The Companies (Trading Disclosures) Regulations 2008, regulations 6 and 7',
    url: 'https://www.legislation.gov.uk/uksi/2008/495/made',
    publisher: 'legislation.gov.uk',
    dateVerified: '2026-09-02',
    claim:
      'A company must disclose its registered name on its websites, and its registered number, part of the UK it is registered in, and registered office address as trading disclosure particulars.',
  },
  ECOMMERCE_REGULATIONS: {
    id: 'ecommerce-regulations-2002',
    title: 'The Electronic Commerce (EC Directive) Regulations 2002, regulation 6',
    url: 'https://www.legislation.gov.uk/uksi/2002/2013/regulation/6/made',
    publisher: 'legislation.gov.uk',
    dateVerified: '2026-09-02',
    claim:
      'An information society service must make its name, geographic address and contact details (including an email address) easily, directly and permanently accessible.',
  },
  ICO_PECR_COOKIES: {
    id: 'ico-pecr-cookies',
    title: 'Cookies and similar technologies',
    url: 'https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/',
    publisher: 'Information Commissioner’s Office',
    dateVerified: '2026-09-02',
    verifiedVia: 'indexed search-result text (direct fetch returned HTTP 403)',
    claim:
      'Consent is required under PECR before storing or accessing information on a user’s device, other than for a narrow "strictly necessary" exemption. Analytics, advertising and similar tracking are not strictly necessary.',
  },
  ICO_INDIVIDUAL_RIGHTS: {
    id: 'ico-individual-rights',
    title: 'A guide to individual rights',
    url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/',
    publisher: 'Information Commissioner’s Office',
    dateVerified: '2026-09-02',
    verifiedVia: 'indexed search-result text (direct fetch returned HTTP 403)',
    claim:
      'Lists the UK GDPR individual rights: access, rectification, erasure, restriction, portability, objection, rights related to automated decision-making, and the right to complain to the ICO.',
  },
  VERCEL_PRIVACY_NOTICE: {
    id: 'vercel-privacy-notice',
    title: 'Privacy Notice',
    url: 'https://vercel.com/legal/privacy-notice',
    publisher: 'Vercel Inc.',
    dateVerified: '2026-09-02',
    claim:
      'Vercel automatically collects service-generated technical information (including log files, IP address, and location derived from IP address) when hosting a site, and states no fixed retention period for this — retention is described only as "the minimum necessary period" for stated purposes.',
  },
  VERCEL_LOGS_DOCS: {
    id: 'vercel-logs-docs',
    title: 'Logs',
    url: 'https://vercel.com/docs/logs',
    publisher: 'Vercel Inc.',
    dateVerified: '2026-09-02',
    claim: 'Runtime log retention "depends on your plan"; Vercel does not publish one fixed retention period across all plans.',
  },
} as const satisfies Record<string, LegalSource>;

export const LEGAL_SOURCE_LIST: LegalSource[] = Object.values(LEGAL_SOURCES);
