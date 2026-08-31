import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '../../lib/seo';
import {
  EDUCATIONAL_DISCLAIMER,
  MARKETPLACE_REPORTING_EXPLANATION,
  PAGE_TITLE,
  PRIVACY_STATEMENT,
  SUPPORTING_COPY,
} from '../../lib/uk-tax-guide/content';
import { UK_TAX_GUIDE_SOURCE_LIST } from '../../lib/uk-tax-guide/sources';
import UkTaxGuideChecker from '../../components/uk-tax-guide/UkTaxGuideChecker';

export const metadata: Metadata = pageMetadata({
  path: '/uk-online-selling-tax-guide',
  title: PAGE_TITLE,
  description: SUPPORTING_COPY,
});

export default function UkOnlineSellingTaxGuidePage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[800px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">{PAGE_TITLE}</h1>
          <p className="text-[#888] text-base leading-relaxed">{SUPPORTING_COPY}</p>
        </header>

        <div className="w-full space-y-3 mb-10 text-sm text-[#888] leading-relaxed">
          <p className="text-[#fb923c]">{EDUCATIONAL_DISCLAIMER}</p>
          <p>{PRIVACY_STATEMENT}</p>
        </div>

        <UkTaxGuideChecker />

        <section className="w-full mt-12 space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">{MARKETPLACE_REPORTING_EXPLANATION.heading}</h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-[#888] leading-relaxed">
            {MARKETPLACE_REPORTING_EXPLANATION.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="w-full mt-12 space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">Official sources</h2>
          <ul className="space-y-2">
            {UK_TAX_GUIDE_SOURCE_LIST.map((source) => (
              <li key={source.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 py-2 border-b border-[#111]">
                <span className="text-[#eaeaea] text-sm">{source.title}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#888] underline hover:text-[#eaeaea] break-all"
                >
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#666] leading-relaxed pt-2">
            Sources verified against the pages above on 31 August 2026. This guide is not tax or accounting advice — see{' '}
            <Link href="/methodology" className="underline hover:text-[#eaeaea]">
              methodology
            </Link>{' '}
            for how this build treats sources generally.
          </p>
        </section>

        <Link href="/" className="mt-12 inline-block text-sm underline text-[#888] hover:text-[#eaeaea]">
          ← Back to calculators
        </Link>
      </div>
    </div>
  );
}
