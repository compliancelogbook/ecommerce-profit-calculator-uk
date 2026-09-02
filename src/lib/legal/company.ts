// Single source of truth for the verified operator/company details used
// across the Privacy Policy, Terms of Use and structured data. Every value
// here was independently confirmed against the live Companies House
// register (not merely copied from a brief) — see sources.ts. Do not add a
// telephone number or residential address here: neither has been verified
// as appropriate to publish.
//
// contactEmail switched from the personal jade@compliancelogbook.com to the
// dedicated info@easyfeezy.com mailbox post-launch (2026-09-02), at the
// site owner's request, to stop publishing a personal company-domain
// address once the product had its own live domain/deployment.

export const COMPANY = {
  operatorName: 'Compliance Logbook Ltd',
  tradingName: 'EasyFeezy',
  companyNumber: '16932013',
  registeredIn: 'England and Wales',
  registeredOffice: '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ',
  contactEmail: 'info@easyfeezy.com',
} as const;
