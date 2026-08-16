"use client";

import { useState, useMemo } from 'react';
import { 
  Platform, Currency, ShopifyPlan, ShopifyPaymentProcessor,
  calculateShopifyProfit, formatMoney 
} from '../lib/calculator-logic';
import { motion, AnimatePresence } from 'framer-motion';

export default function Calculator() {
  const [platform, setPlatform] = useState<Platform>('SHOPIFY');
  const [currency, setCurrency] = useState<Currency>('GBP');
  
  // Base Inputs
  const [soldPrice, setSoldPrice] = useState<string>('100');
  const [itemCost, setItemCost] = useState<string>('20');
  const [shippingCharged, setShippingCharged] = useState<string>('5');
  const [shippingCost, setShippingCost] = useState<string>('4');
  
  // Shopify Specific
  const [shopifyPlan, setShopifyPlan] = useState<ShopifyPlan>('BASIC');
  const [processor, setProcessor] = useState<ShopifyPaymentProcessor>('SHOPIFY_PAYMENTS');
  const [isInternational, setIsInternational] = useState<boolean>(false);

  const results = useMemo(() => {
    if (platform === 'SHOPIFY') {
      return calculateShopifyProfit(
        parseFloat(soldPrice) || 0,
        parseFloat(itemCost) || 0,
        parseFloat(shippingCharged) || 0,
        parseFloat(shippingCost) || 0,
        shopifyPlan,
        processor,
        isInternational
      );
    }
    return calculateShopifyProfit(0,0,0,0,'BASIC','SHOPIFY_PAYMENTS',false);
  }, [platform, soldPrice, itemCost, shippingCharged, shippingCost, shopifyPlan, processor, isInternational]);

  return (
    <div className="w-full bg-[#000000] rounded-xl border border-[#333] p-0 md:p-0 relative overflow-hidden font-sans">
      
      {/* Vercel-style Platform Tabs */}
      <div className="flex px-4 pt-4 border-b border-[#333] overflow-x-auto scrollbar-hide">
        {(['SHOPIFY', 'EBAY', 'AMAZON', 'ETSY'] as Platform[]).map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-5 py-3 text-sm font-medium transition-all relative ${
              platform === p 
              ? 'text-white' 
              : 'text-[#888] hover:text-[#eaeaea]'
            }`}
          >
            {p === 'SHOPIFY' ? 'Shopify' : p === 'EBAY' ? 'eBay' : p === 'AMAZON' ? 'Amazon' : 'Etsy'}
            {platform === p && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN - INPUTS */}
        <div className="lg:col-span-7 p-6 lg:p-10 space-y-8 lg:border-r border-[#333]">
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Transaction Details</h2>
            <div className="bg-[#111] p-1 rounded-md flex border border-[#333]">
              <button onClick={() => setCurrency('GBP')} className={`px-3 py-1 text-xs font-medium rounded ${currency === 'GBP' ? 'bg-[#333] text-white shadow-sm' : 'text-[#888] hover:text-[#eaeaea]'}`}>GBP</button>
              <button onClick={() => setCurrency('USD')} className={`px-3 py-1 text-xs font-medium rounded ${currency === 'USD' ? 'bg-[#333] text-white shadow-sm' : 'text-[#888] hover:text-[#eaeaea]'}`}>USD</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888]">Sold Price</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#888] font-medium">{currency === 'GBP' ? '£' : '$'}</span>
                <input type="number" value={soldPrice} onChange={e => setSoldPrice(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888]">Item Cost</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#888] font-medium">{currency === 'GBP' ? '£' : '$'}</span>
                <input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888]">Shipping Charged</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#888] font-medium">{currency === 'GBP' ? '£' : '$'}</span>
                <input type="number" value={shippingCharged} onChange={e => setShippingCharged(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888]">Actual Shipping Cost</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[#888] font-medium">{currency === 'GBP' ? '£' : '$'}</span>
                <input type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all" />
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-8"></div>

          <AnimatePresence mode="wait">
            {platform === 'SHOPIFY' && (
              <motion.div 
                key="shopify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Platform Configuration</h2>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#888]">Shopify Plan</label>
                  <div className="relative">
                    <select value={shopifyPlan} onChange={e => setShopifyPlan(e.target.value as ShopifyPlan)}
                      className="w-full bg-[#0a0a0a] border border-[#333] text-[#eaeaea] text-sm rounded-md py-2.5 px-3 appearance-none focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] transition-all cursor-pointer">
                      <option value="BASIC">Basic Shopify</option>
                      <option value="SHOPIFY">Shopify</option>
                      <option value="ADVANCED">Advanced Shopify</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#888]">Payment Processor</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setProcessor('SHOPIFY_PAYMENTS')} 
                      className={`py-2 text-sm font-medium rounded-md border transition-all ${processor === 'SHOPIFY_PAYMENTS' ? 'bg-[#fff] text-black border-[#fff]' : 'bg-[#0a0a0a] text-[#888] border-[#333] hover:border-[#666] hover:text-[#eaeaea]'}`}>
                      Shopify Payments
                    </button>
                    <button onClick={() => setProcessor('THIRD_PARTY')} 
                      className={`py-2 text-sm font-medium rounded-md border transition-all ${processor === 'THIRD_PARTY' ? 'bg-[#fff] text-black border-[#fff]' : 'bg-[#0a0a0a] text-[#888] border-[#333] hover:border-[#666] hover:text-[#eaeaea]'}`}>
                      Third Party (e.g. PayPal)
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={isInternational} onChange={e => setIsInternational(e.target.checked)}
                        className="peer appearance-none w-4 h-4 rounded-sm border border-[#333] bg-[#0a0a0a] checked:bg-white checked:border-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20" />
                      <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#eaeaea] group-hover:text-white transition-colors">International Order</div>
                      <div className="text-xs text-[#888]">Additional cross-border fees apply</div>
                    </div>
                  </label>
                </div>

              </motion.div>
            )}

            {platform !== 'SHOPIFY' && (
              <motion.div 
                key="coming-soon"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center p-12 border border-dashed border-[#333] rounded-lg bg-[#050505]"
              >
                <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mb-4 text-[#888]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <p className="text-[#eaeaea] font-medium mb-1">{platform} Calculator</p>
                <p className="text-sm text-[#888]">Coming soon in the next update.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN - RESULTS */}
        <div className="lg:col-span-5 bg-[#050505]">
          <div className="sticky top-0 p-6 lg:p-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              <h3 className="text-sm font-semibold text-[#888] tracking-widest uppercase">Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-[#888] text-sm group-hover:text-[#eaeaea] transition-colors">Total Revenue</span>
                <span className="text-[#eaeaea] text-sm font-medium tabular-nums">{formatMoney(results.totalRevenue, currency)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[#888] text-sm group-hover:text-[#eaeaea] transition-colors">Platform Fee</span>
                <span className="text-[#888] text-sm tabular-nums">-{formatMoney(results.platformFees, currency)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[#888] text-sm group-hover:text-[#eaeaea] transition-colors">Processing Fee</span>
                <span className="text-[#888] text-sm tabular-nums">-{formatMoney(results.processingFees, currency)}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[#111]">
              <div className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-2">Net Profit</div>
              <div className="flex items-baseline space-x-3">
                <div className={`text-5xl font-bold tracking-tighter tabular-nums ${results.profit > 0 ? 'text-white' : results.profit < 0 ? 'text-red-500' : 'text-[#888]'}`}>
                  {formatMoney(results.profit, currency)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
                  <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-1">Margin</div>
                  <div className={`text-lg font-medium tabular-nums ${results.margin > 0 ? 'text-[#eaeaea]' : 'text-red-500'}`}>
                    {results.margin.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
                  <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-1">ROI</div>
                  <div className={`text-lg font-medium tabular-nums ${results.roi > 0 ? 'text-[#eaeaea]' : 'text-red-500'}`}>
                    {results.roi.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
