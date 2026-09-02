// Restrained, truthful structured data for the whole site — an Organization
// node (matching the trading disclosure already shown in the footer) and a
// WebSite node. Deliberately excludes anything not established: no
// aggregateRating/review, no offers/price, no sameAs social profiles, no
// founder/employee count, no logo (no logo asset exists to point to). The
// address used is the public registered office, never a residential one.

import { COMPANY } from './company';

const SITE_URL = 'https://easyfeezy.com';

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: COMPANY.operatorName,
        alternateName: COMPANY.tradingName,
        url: SITE_URL,
        email: COMPANY.contactEmail,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '71-75 Shelton Street, Covent Garden',
          addressLocality: 'London',
          postalCode: 'WC2H 9JQ',
          addressCountry: 'GB',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: COMPANY.tradingName,
        url: SITE_URL,
        inLanguage: 'en-GB',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}
