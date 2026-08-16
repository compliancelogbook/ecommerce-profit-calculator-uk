import Calculator from '../components/Calculator';
import AdPlaceholder from '../components/AdPlaceholder';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 selection:bg-[#fff] selection:text-[#000] font-sans overflow-x-hidden">
      
      {/* Glow Effect matching Vercel */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white opacity-[0.03] blur-[100px] rounded-[100%] pointer-events-none"></div>

      {/* Top Banner Ad */}
      <div className="w-full max-w-4xl mx-auto mb-12 hidden sm:block">
        <AdPlaceholder text="728x90 LEADERBOARD AD" />
      </div>

      <div className="w-full max-w-[1000px] relative z-10 flex flex-col items-center">
        
        <header className="mb-16 text-center space-y-6">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-2 text-xs font-medium tracking-widest text-[#888] uppercase bg-[#111] border border-[#333] rounded-full">
            <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
            Professional Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tighter leading-tight max-w-3xl mx-auto">
            Fee Calculators for Online Sellers Worldwide
          </h1>
          <p className="text-[#888] text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, and Amazon. Constantly updated with the latest changes.
          </p>
        </header>

        <main className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <Calculator />
        </main>
        
        {/* Mobile Rectangle Ad */}
        <div className="w-full max-w-sm mx-auto mt-12 sm:hidden">
          <AdPlaceholder text="300x250 RECTANGLE AD" height="h-[250px]" />
        </div>

        <footer className="mt-24 pt-8 border-t border-[#333] w-full text-[#666] text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-medium">© {new Date().getFullYear()} Compliance Logbook. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[#eaeaea] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#eaeaea] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#eaeaea] transition-colors">Contact</a>
          </div>
        </footer>
      </div>
      
    </div>
  );
}
