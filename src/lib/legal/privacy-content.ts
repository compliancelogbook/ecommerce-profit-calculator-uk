// Privacy Policy copy, kept as data so the specific factual claims it makes
// (and the claims it deliberately avoids making) can be unit tested — see
// __tests__/legal-content.test.ts. Every material claim traces to
// LEGAL_SOURCES or to the application audit's own confirmed V1 behaviour
// (client-side calculation, no cookies, no localStorage/sessionStorage, no
// analytics, no accounts). Nothing here asserts an absolute "no personal
// data is ever processed", a specific Vercel log-retention period, or legal
// certainty — see the "Hosting and technical information" section.

import { COMPANY } from './company';

export const PRIVACY_UPDATED = '2026-09-02';

export const PRIVACY_SECTIONS = [
  {
    heading: 'Who operates EasyFeezy',
    body: [
      `EasyFeezy is a trading name of ${COMPANY.operatorName} (company number ${COMPANY.companyNumber}), registered in ${COMPANY.registeredIn}. Registered office: ${COMPANY.registeredOffice}. ${COMPANY.operatorName} is the controller for the limited processing described in this policy.`,
    ],
  },
  {
    heading: 'What the calculators do',
    body: [
      'The marketplace fee calculators and the UK Seller Tax Guide run entirely in your browser. The figures you enter — sold price, item cost, shipping, quantity, VAT status, category and similar inputs — are used only to compute a result on your own screen. They are not submitted to EasyFeezy, are not sent to any server we operate, and are not stored by us in any database.',
      'Refreshing or leaving the page clears whatever you entered. There is currently no account system and no feature to save a calculation for later.',
    ],
  },
  {
    heading: 'Cookies, local storage and tracking',
    body: [
      'EasyFeezy does not currently set any cookies of its own, does not use browser local storage or session storage, and does not run analytics, advertising or affiliate-tracking scripts. Nothing on the site currently asks for or relies on cookie consent, because nothing non-essential is currently stored on or read from your device.',
      'If this changes in a future version — for example, if privacy-conscious analytics is introduced — this policy and the site’s consent approach will be updated first, and any consent required under the Privacy and Electronic Communications Regulations (PECR) will be obtained before that change goes live.',
    ],
  },
  {
    heading: 'Hosting and technical information',
    body: [
      'EasyFeezy is hosted on Vercel. Delivering any website over the internet necessarily involves some technical information passing through the hosting provider and the normal infrastructure between your device and the server — this is not specific to EasyFeezy. This can include your IP address, approximate location derived from it, browser and device information, the page requested, and timestamps, typically captured in request or security logs.',
      'We do not operate a separate analytics pipeline that receives this information, and we do not use it to identify individual visitors. We cannot state that no technical information is ever processed by our hosting provider or by intermediate internet infrastructure — that would not be accurate — and Vercel’s own documentation does not publish one fixed retention period for this information; retention depends on Vercel’s plan and configuration. See Vercel’s own Privacy Notice, linked below, for how Vercel itself describes this.',
    ],
  },
  {
    heading: 'External links',
    body: [
      'EasyFeezy links to official third-party pages — marketplace fee pages, HMRC and GOV.UK guidance, and similar sources — so that you can verify figures directly. Those sites are operated independently of EasyFeezy and have their own privacy practices, which this policy does not cover.',
    ],
  },
  {
    heading: 'Contacting EasyFeezy by email',
    body: [
      `If you email ${COMPANY.contactEmail}, we process the contents of your message and your email address to read and respond to it, and to keep a reasonable record of that correspondence. We do not add your email address to a mailing list from a support email — EasyFeezy does not currently operate a newsletter.`,
    ],
  },
  {
    heading: 'Lawful basis and retention',
    body: [
      'Where we process personal data at all — principally, an email you choose to send us — our lawful basis is legitimate interests: responding to correspondence you have initiated, and keeping a proportionate record of it. We keep that correspondence only for as long as reasonably necessary to deal with it and for our own record-keeping, and you can ask us to delete it at any time (see your rights, below).',
      'For the technical/hosting information described above, retention is set by our hosting provider, not by EasyFeezy directly — see the Hosting section.',
    ],
  },
  {
    heading: 'Your data protection rights',
    body: [
      'Under UK GDPR, you have the right to ask what personal data we hold about you (access), to have inaccurate data corrected (rectification), to ask for data to be deleted in certain circumstances (erasure), to ask us to pause processing while a query is resolved (restriction), to receive certain data in a portable format (portability), and to object to processing in certain circumstances. None of these rights are absolute, and how they apply depends on the specific processing involved.',
      'You also have the right to complain to the Information Commissioner’s Office (ICO) at ico.org.uk if you believe your data has not been handled correctly — though we would appreciate the chance to address it directly first.',
    ],
  },
  {
    heading: 'Contacting us about privacy',
    body: [`For any privacy question or request, email ${COMPANY.contactEmail}.`],
  },
];
