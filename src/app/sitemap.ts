import type { MetadataRoute } from 'next';

export const dynamic = "force-static";

const BASE_URL = 'https://easyfeezy.com';

const ROUTES: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/shopify-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/etsy-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/ebay-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/amazon-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tiktok-shop-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/vinted-fee-calculator', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/uk-online-selling-tax-guide', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/methodology', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
