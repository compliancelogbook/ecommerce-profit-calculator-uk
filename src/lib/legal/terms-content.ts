// Terms of Use copy, kept as data for the same reason as privacy-content.ts
// — so specific required/forbidden claims can be unit tested. Deliberately
// does not describe affiliate or advertising terms: neither is active in
// V1 (see docs/PRODUCT-ROADMAP.md §8), and adding that language now would
// misrepresent the current site.

import { COMPANY } from './company';

export const TERMS_UPDATED = '2026-09-02';

export const TERMS_SECTIONS = [
  {
    heading: 'Who these terms are with',
    body: [
      `EasyFeezy is a trading name of ${COMPANY.operatorName} (company number ${COMPANY.companyNumber}), registered in ${COMPANY.registeredIn}, registered office ${COMPANY.registeredOffice}. References to "EasyFeezy", "we", "us" or "our" in these terms mean ${COMPANY.operatorName}. By using this site, you agree to these terms.`,
    ],
  },
  {
    heading: 'What EasyFeezy is',
    body: [
      'EasyFeezy provides informational marketplace fee and profit calculators and a general UK online-seller tax guidance checker. It is a calculation and information tool, not a personalised advisory service.',
    ],
  },
  {
    heading: 'Calculations depend on your inputs',
    body: [
      'Every result depends entirely on the figures and settings you enter and the assumptions you choose (for example, a manually entered fee rate, a VAT-registration status, or an FX-rate assumption). A different input, a different selected assumption, or a category or scenario EasyFeezy does not yet cover will produce a different, or no, result. Where a fee is variable, unknown or not yet independently verified, EasyFeezy discloses this as an assumption or exclusion rather than guessing — see the Methodology page for how each platform is modelled.',
    ],
  },
  {
    heading: 'Marketplace terms, prices and tax rules change',
    body: [
      'Marketplace fees, thresholds, promotions, category rules, VAT treatment and other policies are set by the relevant marketplace (and, for tax matters, by HMRC) and can change at any time, including after a given result was last verified. You are responsible for checking the current terms of the marketplace you intend to sell on, and current HMRC guidance where relevant, before relying on a figure from this site for a material decision.',
    ],
  },
  {
    heading: 'Not personal advice',
    body: [
      'EasyFeezy does not provide personal legal, tax, accounting, financial or investment advice, and nothing on this site should be treated as such. The UK Seller Tax Guide is general educational guidance, not a substitute for HMRC’s own tools or a qualified accountant. Speak to an appropriately qualified professional, or use HMRC’s own tools, before making a decision that depends on your personal circumstances.',
    ],
  },
  {
    heading: 'No guarantee of complete coverage',
    body: [
      'EasyFeezy aims to model each supported marketplace’s published fee schedule accurately, but does not guarantee that every possible fee, promotion, tax treatment, seller circumstance or marketplace policy is included. Some marketplaces and calculation paths are not yet covered at all.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'EasyFeezy is provided for general informational purposes, on an "as is" basis, without warranties of any kind as to accuracy, completeness or fitness for a particular purpose, to the fullest extent permitted by law. To the fullest extent permitted by law, we exclude liability for any loss arising from reliance on a calculation or from use of, or inability to use, this site.',
      'Nothing in these terms excludes or limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability which cannot lawfully be excluded or limited under the law of England and Wales.',
    ],
  },
  {
    heading: 'Third-party links',
    body: [
      'This site links to official third-party pages (marketplace fee pages, GOV.UK/HMRC guidance and similar sources) for verification. We are not responsible for the content, accuracy or availability of any third-party site, and linking to it does not imply endorsement.',
    ],
  },
  {
    heading: 'Intellectual property and acceptable use',
    body: [
      'The EasyFeezy name, branding, page design and original written content are owned by or licensed to us and may not be copied, redistributed or used to create a competing service without permission. You may use the calculators for your own personal or business purposes. You must not attempt to scrape, systematically extract or automate large-scale use of the site in a way that degrades it for other users, misrepresent a calculator estimate as an official marketplace fee quotation or tax assessment, or attempt to circumvent or interfere with the site’s normal operation.',
    ],
  },
  {
    heading: 'Availability and changes',
    body: [
      'We may change, suspend, or discontinue any part of this site, including adding, altering or removing a calculator, marketplace or feature, at any time. We do not guarantee uninterrupted availability.',
    ],
  },
  {
    heading: 'Governing law and jurisdiction',
    body: [
      'These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction over any dispute arising from them or from your use of this site.',
    ],
  },
  {
    heading: 'Contact',
    body: [`For any question about these terms, email ${COMPANY.contactEmail}.`],
  },
];
