"use client";

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import type { VatProfile } from '../../data/vat';
import { calculateShopify } from '../../lib/engines/shopify';
import { calculateEtsy } from '../../lib/engines/etsy';
import { calculateEbay } from '../../lib/engines/ebay';
import { calculateAmazon } from '../../lib/engines/amazon';
import type { CalculationResult } from '../../lib/types';
import { MoneyField, NumberField, SegmentedToggle } from './inputs';
import ShopifyPanel, { type ShopifyPanelState } from './ShopifyPanel';
import EtsyPanel, { type EtsyPanelState } from './EtsyPanel';
import EbayPanel, { type EbayPanelState } from './EbayPanel';
import AmazonPanel, { type AmazonPanelState } from './AmazonPanel';
import ResultsPanel from './ResultsPanel';

export type Platform = 'SHOPIFY' | 'ETSY' | 'EBAY' | 'AMAZON';

const PLATFORM_LABEL: Record<Platform, string> = { SHOPIFY: 'Shopify', ETSY: 'Etsy', EBAY: 'eBay', AMAZON: 'Amazon' };

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export default function CalculatorShell({ defaultPlatform = 'SHOPIFY' }: { defaultPlatform?: Platform }) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);

  // Shared transaction inputs
  const [soldPrice, setSoldPrice] = useState('30');
  const [itemCost, setItemCost] = useState('10');
  const [shippingCharged, setShippingCharged] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [vatProfile, setVatProfile] = useState<VatProfile>('NOT_REGISTERED');

  const [shopify, setShopify] = useState<ShopifyPanelState>({
    plan: 'BASIC',
    processor: 'SHOPIFY_PAYMENTS',
    cardType: 'STANDARD',
    expectedMonthlyOrders: '',
    useThirdPartyAssumption: false,
    thirdPartyRate: '',
    thirdPartyFixed: '',
  });

  const [etsy, setEtsy] = useState<EtsyPanelState>({
    currencyConversionSelected: false,
    offsiteAdsRate: null,
    vatIdSupplied: true,
    usdToGbpRate: '0.75',
  });

  const [ebay, setEbay] = useState<EbayPanelState>({
    categoryId: 'EVERYTHING_ELSE',
    manualCategoryRate: '',
    region: 'DOMESTIC',
    currencyConversionSelected: false,
    topRatedPremiumService: false,
  });

  const [amazon, setAmazon] = useState<AmazonPanelState>({
    sellerPlan: 'INDIVIDUAL',
    categoryId: 'EVERYTHING_ELSE',
    manualCategoryRate: '',
    expectedMonthlyUnits: '',
  });

  const result: CalculationResult = useMemo(() => {
    const shared = {
      soldPrice: num(soldPrice),
      itemCost: num(itemCost),
      shippingCharged: num(shippingCharged),
      shippingCost: num(shippingCost),
      quantity: num(quantity) || 1,
    };

    switch (platform) {
      case 'SHOPIFY':
        return calculateShopify({
          soldPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          plan: shopify.plan,
          processor: shopify.processor,
          cardType: shopify.cardType,
          thirdPartyProcessor:
            shopify.processor === 'THIRD_PARTY' && shopify.useThirdPartyAssumption
              ? { rate: num(shopify.thirdPartyRate) / 100, fixed: num(shopify.thirdPartyFixed) }
              : null,
          expectedMonthlyOrders: shopify.expectedMonthlyOrders ? num(shopify.expectedMonthlyOrders) : null,
        });
      case 'ETSY':
        return calculateEtsy({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          currencyConversionSelected: etsy.currencyConversionSelected,
          offsiteAdsRate: etsy.offsiteAdsRate,
          vatIdSupplied: etsy.vatIdSupplied,
          vatProfile,
          usdToGbpRate: etsy.usdToGbpRate ? num(etsy.usdToGbpRate) : undefined,
        });
      case 'EBAY':
        return calculateEbay({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          categoryId: ebay.categoryId,
          manualCategoryRate: ebay.categoryId === UNSUPPORTED_CATEGORY_ID ? num(ebay.manualCategoryRate) / 100 : null,
          region: ebay.region,
          currencyConversionSelected: ebay.currencyConversionSelected,
          topRatedPremiumService: ebay.topRatedPremiumService,
          vatProfile,
        });
      case 'AMAZON':
        return calculateAmazon({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          deliveryCharge: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          sellerPlan: amazon.sellerPlan,
          categoryId: amazon.categoryId,
          manualCategoryRate: amazon.categoryId === UNSUPPORTED_CATEGORY_ID ? num(amazon.manualCategoryRate) / 100 : null,
          expectedMonthlyUnits: amazon.expectedMonthlyUnits ? num(amazon.expectedMonthlyUnits) : null,
          vatProfile,
        });
    }
  }, [platform, soldPrice, itemCost, shippingCharged, shippingCost, quantity, vatProfile, shopify, etsy, ebay, amazon]);

  return (
    <div className="w-full bg-[#000000] rounded-xl border border-[#333] p-0 md:p-0 relative overflow-hidden font-sans">
      <div className="flex px-4 pt-2 border-b border-[#333] overflow-x-auto scrollbar-hide">
        {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-5 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
              platform === p ? 'text-white' : 'text-[#888] hover:text-[#eaeaea]'
            }`}
          >
            {PLATFORM_LABEL[p]}
            {platform === p && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 lg:p-10 space-y-8 lg:border-r border-[#333]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Transaction Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoneyField label="Sold Price (per unit)" value={soldPrice} onChange={setSoldPrice} />
            <MoneyField label="Item Cost (per unit)" value={itemCost} onChange={setItemCost} />
            <MoneyField label="Shipping Charged (order total)" value={shippingCharged} onChange={setShippingCharged} />
            <MoneyField label="Actual Shipping Cost (order total)" value={shippingCost} onChange={setShippingCost} />
            <NumberField label="Quantity" value={quantity} onChange={setQuantity} placeholder="1" />
          </div>

          <SegmentedToggle<VatProfile>
            label="VAT Profile"
            value={vatProfile}
            onChange={setVatProfile}
            options={[
              { value: 'NOT_REGISTERED', label: 'Not VAT registered' },
              { value: 'REGISTERED', label: 'VAT registered' },
            ]}
          />

          <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-8"></div>

          <AnimatePresence mode="wait">
            <motion.div key={platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {platform === 'SHOPIFY' && <ShopifyPanel state={shopify} onChange={(patch) => setShopify((s) => ({ ...s, ...patch }))} />}
              {platform === 'ETSY' && <EtsyPanel state={etsy} onChange={(patch) => setEtsy((s) => ({ ...s, ...patch }))} />}
              {platform === 'EBAY' && <EbayPanel state={ebay} onChange={(patch) => setEbay((s) => ({ ...s, ...patch }))} />}
              {platform === 'AMAZON' && <AmazonPanel state={amazon} onChange={(patch) => setAmazon((s) => ({ ...s, ...patch }))} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5 bg-[#050505]">
          <ResultsPanel result={result} />
        </div>
      </div>
    </div>
  );
}
