import type { Metadata } from 'next';
import Link from 'next/link';
import MarketplaceCalculatorLinks from '../components/site/MarketplaceCalculatorLinks';
import { homeMetadata } from '../lib/seo';
import { OPTIONAL_HOME_ENTRY_COPY } from '../lib/uk-tax-guide/content';

export const metadata: Metadata = homeMetadata({
  title: 'EasyFeezy — Marketplace Fee & Profit Calculator',
  description:
    "Marketplace fees made easy. Know what you'll actually make before you sell — accurate Shopify, Etsy, eBay, Amazon, TikTok Shop UK and Vinted UK seller fee and profit calculators.",
});

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 selection:bg-[#fff] selection:text-[#000] font-sans overflow-x-hidden">

      {/* Glow Effect matching Vercel */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white opacity-[0.03] blur-[100px] rounded-[100%] pointer-events-none"></div>

      <div className="w-full max-w-[1000px] relative z-10 flex flex-col items-center">

        <header className="mb-16 text-center space-y-6">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-2 text-xs font-medium tracking-widest text-[#888] uppercase bg-[#111] border border-[#333] rounded-full">
            <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
            EasyFeezy · Marketplace Fee &amp; Profit Calculator
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tighter leading-tight max-w-3xl mx-auto">
            Marketplace fees made easy.
          </h1>
          <p className="text-[#eaeaea] text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-medium">
            Know what you&apos;ll actually make before you sell.
          </p>
          <p className="text-[#888] text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, Amazon, TikTok Shop UK, and Vinted UK. Checked against current official sources, with verification dates shown.
          </p>
        </header>

        {/*
          Stage 1 of a controlled homepage-performance refactor. The
          homepage previously embedded the full interactive calculator
          component directly — all six platform panels, calculation
          engines, validation logic, fee datasets and Framer Motion —
          which real-device testing traced as the cause of a prolonged
          blank white load on mobile: /privacy, which carries none of
          that, loaded immediately on the same phone/connection. This is a
          lightweight, server-rendered marketplace gateway instead:
          ordinary semantic links to each platform's own dedicated
          calculator route (see MarketplaceCalculatorLinks, shared with
          every dedicated route's own nav), no client-side state, and
          nothing calculator-related imported into this file. The full
          calculator still lives on each dedicated route, unchanged.
        */}
        <main className="w-full flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight text-center">
            Choose your marketplace
          </h2>
          <MarketplaceCalculatorLinks />
        </main>

        <p className="mt-6 text-sm text-[#666]">
          <Link
            href="/uk-online-selling-tax-guide"
            className="underline hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            {OPTIONAL_HOME_ENTRY_COPY}
          </Link>
        </p>
      </div>

    </div>
  );
}
