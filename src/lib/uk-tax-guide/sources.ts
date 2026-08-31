// Central source metadata for the UK Online Seller Tax Guide. Every claim
// made by the checker (src/lib/uk-tax-guide/decision.ts) and the static page
// copy (src/lib/uk-tax-guide/content.ts) must trace back to one of these —
// official GOV.UK / HMRC pages only, no blogs, accountancy marketing pages,
// AI summaries or unsourced interpretations. Each entry was fetched and
// checked directly against this feature's requirements before any guidance
// text was written (see the "date verified" below for when).

export interface GuidanceSource {
  id: string;
  /** The source page's own title. */
  title: string;
  url: string;
  publisher: string;
  /** ISO date this source was actually fetched and checked against the guidance text below — never invented. */
  dateVerified: string;
  /** What specific claim(s) in this feature's guidance text this source supports. */
  claim: string;
}

export const UK_TAX_GUIDE_SOURCES = {
  PLATFORM_INCOME_CHECKER: {
    id: 'platform-income-checker',
    title: 'Check if you need to tell HMRC about your income from online platforms',
    url: 'https://www.gov.uk/guidance/check-if-you-need-to-tell-hmrc-about-your-income-from-online-platforms',
    publisher: 'HM Revenue & Customs (GOV.UK)',
    dateVerified: '2026-08-31',
    claim:
      'The official checker for a definitive, personalised answer; confirms the £1,000 trading-income test and the £6,000 personal-possession Capital Gains Tax consideration referenced throughout this guide.',
  },
  TRADING_ALLOWANCE: {
    id: 'trading-allowance',
    title: 'Tax-free allowances on property and trading income',
    url: 'https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income',
    publisher: 'HM Revenue & Customs (GOV.UK)',
    dateVerified: '2026-08-31',
    claim:
      'The £1,000 trading allowance is tested against combined gross trading income (before expenses); if you claim the allowance you cannot also deduct actual expenses; income at or under £1,000 may not need to be told to HMRC.',
  },
  CGT_PERSONAL_POSSESSIONS: {
    id: 'cgt-personal-possessions',
    title: 'Capital Gains Tax: personal possessions',
    url: 'https://www.gov.uk/capital-gains-tax-personal-possessions',
    publisher: 'HM Revenue & Customs (GOV.UK)',
    dateVerified: '2026-08-31',
    claim:
      'A personal possession (including a qualifying set/collection) sold for £6,000 or more may require Capital Gains Tax consideration, based on the gain made, not the full sale proceeds.',
  },
  TAX_HELP_FOR_HUSTLES: {
    id: 'tax-help-for-hustles',
    title: 'Buying or making things to sell, and online selling tax rules',
    url: 'https://taxhelpforhustles.campaign.gov.uk/buying-or-making-things-to-sell-and-online-selling-tax-rules/',
    publisher: 'HM Revenue & Customs (Tax Help for Hustles, GOV.UK campaign)',
    dateVerified: '2026-08-31',
    claim:
      'Buying, making or upcycling goods with the intention of selling for profit is trading; the £1,000 allowance is a single combined allowance across all side hustles, not one per platform.',
  },
  NO_TAX_CHANGES_ANNOUNCEMENT: {
    id: 'no-tax-changes-announcement',
    title: 'No tax changes for online sellers',
    url: 'https://www.gov.uk/government/news/no-tax-changes-for-online-sellers',
    publisher: 'HM Revenue & Customs / GOV.UK news',
    dateVerified: '2026-08-31',
    claim:
      'Platforms sharing seller data with HMRC (from sellers meeting the roughly 30-item/€2,000 reporting threshold) is a new reporting requirement on platforms, not a new tax — sharing that data does not by itself mean an individual owes tax.',
  },
} as const satisfies Record<string, GuidanceSource>;

export type SourceId = (typeof UK_TAX_GUIDE_SOURCES)[keyof typeof UK_TAX_GUIDE_SOURCES]['id'];

export const UK_TAX_GUIDE_SOURCE_LIST: GuidanceSource[] = Object.values(UK_TAX_GUIDE_SOURCES);
