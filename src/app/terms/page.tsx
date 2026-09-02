import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '../../lib/legal/company';
import { TERMS_SECTIONS, TERMS_UPDATED } from '../../lib/legal/terms-content';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/terms',
  title: 'Terms of Use',
  description: 'The terms that apply to using EasyFeezy\'s marketplace fee calculators and UK Seller Tax Guide.',
});

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans">
      <div className="w-full max-w-[800px] space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter">Terms of Use</h1>
          <p className="text-[#888] text-base leading-relaxed">
            These terms apply to your use of {COMPANY.tradingName}, a trading name of {COMPANY.operatorName}. Please read them alongside
            our <Link href="/privacy" className="underline hover:text-[#eaeaea]">Privacy Policy</Link>.
          </p>
        </header>

        <div className="space-y-8">
          {TERMS_SECTIONS.map((section) => (
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

        <p className="text-xs text-[#666]">Terms last updated: {TERMS_UPDATED}.</p>

        <Link href="/" className="inline-block text-sm underline text-[#888] hover:text-[#eaeaea]">← Back to calculator</Link>
      </div>
    </div>
  );
}
