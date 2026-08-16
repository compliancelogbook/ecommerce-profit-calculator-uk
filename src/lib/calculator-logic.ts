export type Platform = 'SHOPIFY' | 'EBAY' | 'AMAZON' | 'ETSY';
export type Country = 'US' | 'UK' | 'AU' | 'CA' | 'DE' | 'FR' | 'IT';
export type Currency = 'USD' | 'GBP' | 'AUD' | 'CAD' | 'EUR';

export const COUNTRY_CURRENCY_MAP: Record<Country, Currency> = {
  US: 'USD',
  UK: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
};

export const COUNTRY_FLAGS: Record<Country, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  AU: '🇦🇺',
  CA: '🇨🇦',
  DE: '🇩🇪',
  FR: '🇫🇷',
  IT: '🇮🇹',
};

// Shopify Specific Types
export type ShopifyPlan = 'BASIC' | 'SHOPIFY' | 'ADVANCED';
export type ShopifyPaymentProcessor = 'SHOPIFY_PAYMENTS' | 'THIRD_PARTY';

export interface CalculationResult {
  totalRevenue: number;
  platformFees: number;
  processingFees: number;
  totalFees: number;
  profit: number;
  margin: number;
  roi: number;
  vat: number;
}

export function calculateShopifyProfit(
  soldPrice: number,
  costPrice: number,
  shippingCharged: number,
  shippingCost: number,
  plan: ShopifyPlan,
  processor: ShopifyPaymentProcessor,
  isInternational: boolean
): CalculationResult {
  const totalRevenue = soldPrice + shippingCharged;
  const totalCosts = costPrice + shippingCost;
  
  let platformFees = 0; // Third-party transaction fee
  let processingFees = 0; // Credit card processing fee
  
  if (processor === 'SHOPIFY_PAYMENTS') {
    // UK Rates
    const onlineRate = isInternational ? 0.02 : (plan === 'BASIC' ? 0.02 : plan === 'SHOPIFY' ? 0.017 : 0.015);
    const fixedFee = 0.25; // 25p
    processingFees = (totalRevenue * onlineRate) + fixedFee;
  } else {
    // Third Party Gateway
    const thirdPartyRate = plan === 'BASIC' ? 0.02 : plan === 'SHOPIFY' ? 0.01 : 0.005;
    platformFees = totalRevenue * thirdPartyRate;
    
    // Assume standard PayPal/Stripe rate for the actual processing
    const externalProcessingRate = isInternational ? 0.039 : 0.029;
    processingFees = (totalRevenue * externalProcessingRate) + 0.30;
  }

  const totalFees = platformFees + processingFees;
  const vat = 0; // Shopify fees might have VAT, but generally businesses reclaim it. We will leave 0 for simplicity.

  const profit = totalRevenue - totalCosts - totalFees;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;

  return {
    totalRevenue,
    platformFees,
    processingFees,
    totalFees,
    profit,
    margin,
    roi,
    vat
  };
}

export function formatMoney(amount: number, currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    GBP: 'en-GB',
    USD: 'en-US',
    AUD: 'en-AU',
    CAD: 'en-CA',
    EUR: 'de-DE', // general Euro formatting
  };
  
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency: currency
  }).format(amount);
}
