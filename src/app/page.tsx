import type { Metadata } from 'next';
import CalculatorShell from '../components/calculator/CalculatorShell';
import Link from 'next/link';
import { homeMetadata } from '../lib/seo';

export const metadata: Metadata = homeMetadata({
  title: 'EasyFeezy — Marketplace Fee & Profit Calculator',
  description:
    "Marketplace fees made easy. Know what you'll actually make before you sell — accurate Shopify, Etsy, eBay and Amazon UK seller fee and profit calculators.",
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
            Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, and Amazon UK. Constantly updated with the latest changes.
          </p>
        </header>

        <main className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <CalculatorShell />
        </main>

        <nav aria-label="Marketplace calculators" className="w-full mt-10 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/shopify-fee-calculator" className="px-3 py-1.5 rounded-full border border-[#333] text-[#888] hover:text-[#eaeaea] hover:border-[#666] transition-all">Shopify Fee Calculator</Link>
          <Link href="/etsy-fee-calculator" className="px-3 py-1.5 rounded-full border border-[#333] text-[#888] hover:text-[#eaeaea] hover:border-[#666] transition-all">Etsy Fee Calculator</Link>
          <Link href="/ebay-fee-calculator" className="px-3 py-1.5 rounded-full border border-[#333] text-[#888] hover:text-[#eaeaea] hover:border-[#666] transition-all">eBay Fee Calculator</Link>
          <Link href="/amazon-fee-calculator" className="px-3 py-1.5 rounded-full border border-[#333] text-[#888] hover:text-[#eaeaea] hover:border-[#666] transition-all">Amazon Fee Calculator</Link>
        </nav>
      </div>

    </div>
  );
}
