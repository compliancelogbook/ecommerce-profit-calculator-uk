// Static, always-visible guidance copy for the UK Online Seller Tax Guide —
// kept as data (not inline JSX) so it can be unit tested directly for the
// specific claims/non-claims this feature requires, the same way
// decision.ts is tested. Every point here traces to UK_TAX_GUIDE_SOURCES.

import { UK_TAX_GUIDE_SOURCES } from './sources';

export const PAGE_TITLE = 'UK Online Seller Tax Guide';
export const SUPPORTING_COPY =
  'Selling unwanted items or running a resale business? Check which UK tax rules may be relevant.';

export const EDUCATIONAL_DISCLAIMER =
  'This is general educational guidance, not personal tax advice. It cannot tell you exactly what you owe, and it is not a substitute for HMRC\'s own tools or a qualified accountant. For a definitive, personalised answer, use the official HMRC online-platform income checker linked below.';

export const PRIVACY_STATEMENT =
  "EasyFeezy does not send your answers to HMRC, and does not need to store them. This guide runs entirely in your browser — your answers exist only on your screen and are gone when you leave or refresh the page.";

/** Always-visible — not tied to any specific answer — per the requirement to explain this "separately". */
export const MARKETPLACE_REPORTING_EXPLANATION = {
  heading: 'Marketplace reporting and your tax liability are different questions',
  points: [
    'From 2024, online marketplaces must share some sellers\' data with HMRC — this is a REPORTING requirement placed on platforms, not a new tax.',
    'HMRC has confirmed this did not create a new online-selling tax and that no tax rules changed for personal-item sellers because of it.',
    'The platform-reporting threshold (roughly 30 items sold, or about €2,000, in a year) decides whether a PLATFORM must report your data — it is not a new tax-free allowance, and it is not the same as the separate £1,000 trading-income test described above.',
    'A platform sharing your sales data with HMRC does not automatically mean you owe tax. Whether you owe anything still depends on whether the activity counts as trading and on the rules explained above.',
  ],
  sourceIds: [UK_TAX_GUIDE_SOURCES.NO_TAX_CHANGES_ANNOUNCEMENT.id, UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id],
};

export const OPTIONAL_HOME_ENTRY_COPY = 'Not sure about UK tax? Check the seller tax guide.';
