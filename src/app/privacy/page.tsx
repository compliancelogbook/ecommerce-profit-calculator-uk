import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '../../lib/legal/company';
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../../lib/legal/privacy-content';
import { LEGAL_SOURCES } from '../../lib/legal/sources';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/privacy',
  title: 'Privacy Policy',
  description: 'How EasyFeezy handles information: client-side calculators, hosting/technical information, cookies, and your data protection rights.',
});

const SOURCES = [
  LEGAL_SOURCES.COMPANIES_HOUSE_REGISTER,
  LEGAL_SOURCES.TRADING_DISCLOSURES_REGULATIONS,
  LEGAL_SOURCES.ECOMMERCE_REGULATIONS,
  LEGAL_SOURCES.ICO_PECR_COOKIES,
  LEGAL_SOURCES.ICO_INDIVIDUAL_RIGHTS,
  LEGAL_SOURCES.VERCEL_PRIVACY_NOTICE,
  LEGAL_SOURCES.VERCEL_LOGS_DOCS,
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans">
      <div className="w-full max-w-[800px] space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter">Privacy Policy</h1>
          <p className="text-[#888] text-base leading-relaxed">
            This policy explains how {COMPANY.operatorName}, trading as {COMPANY.tradingName}, handles information in connection with this
            site. It is written for EasyFeezy&apos;s actual current behaviour, not a generic template — see &quot;What the calculators
            do&quot; below for the specific, factual position.
          </p>
        </header>

        <div className="space-y-8">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="text-sm text-[#888] leading-relaxed">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Sources</h2>
          <ul>
            {SOURCES.map((s) => (
              <li key={s.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 py-2 border-b border-[#111]">
                <span className="text-[#eaeaea] text-sm">{s.title}</span>
                <span className="text-xs text-[#888] flex items-center gap-3">
                  <span>Verified {s.dateVerified}</span>
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea] break-all">
                    {s.url}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-[#666]">Policy last updated: {PRIVACY_UPDATED}. See also our <Link href="/terms" className="underline hover:text-[#eaeaea]">Terms of Use</Link>.</p>

        <Link href="/" className="inline-block text-sm underline text-[#888] hover:text-[#eaeaea]">← Back to calculator</Link>
      </div>
    </div>
  );
}
