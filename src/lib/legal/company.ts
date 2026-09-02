// Single source of truth for the verified operator/company details used
// across the Privacy Policy, Terms of Use and structured data. Every value
// here was independently confirmed against the live Companies House
// register (not merely copied from a brief) — see sources.ts. Do not add a
// telephone number or residential address here: neither has been verified
// as appropriate to publish.

export const COMPANY = {
  operatorName: 'Compliance Logbook Ltd',
  tradingName: 'EasyFeezy',
  companyNumber: '16932013',
  registeredIn: 'England and Wales',
  registeredOffice: '71–75 Shelton Street, Covent Garden, London, WC2H 9JQ',
  contactEmail: 'jade@compliancelogbook.com',
} as const;
