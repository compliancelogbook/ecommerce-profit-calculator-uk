import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "../components/site/SiteHeader";
import SiteFooter from "../components/site/SiteFooter";
import { buildOrganizationJsonLd } from "../lib/legal/structured-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "EasyFeezy";
const SITE_DESCRIPTION =
  "Marketplace fees made easy. Know what you'll actually make before you sell — accurate Shopify, Etsy, eBay, Amazon, TikTok Shop UK and Vinted UK seller fee and profit calculators.";

// Every real route sets its own canonical/openGraph.url/title via
// src/lib/seo.ts (pageMetadata / homeMetadata) — this root metadata is only
// a fallback for a route with no metadata of its own (e.g. the default
// not-found page), so it deliberately carries no canonical or openGraph.url:
// a route-less fallback URL would otherwise be inherited by every page that
// doesn't override it, which is the exact defect this pattern avoids.
export const metadata: Metadata = {
  metadataBase: new URL("https://easyfeezy.com"),
  title: {
    template: "%s | EasyFeezy",
    default: "EasyFeezy — Marketplace Fee & Profit Calculator",
  },
  description: SITE_DESCRIPTION,
  keywords: "shopify fee calculator, ebay fee calculator, amazon fee calculator, etsy fee calculator, vinted fee calculator, seller profit calculator, ecommerce margin calculator, shopify payments fees",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Explicit ReactNode typing rather than the Next.js-generated `LayoutProps<"/">`
// global — that type only exists after `next build`/`next dev` has run once
// and produced `.next/types/`. On a genuinely fresh clone, `npx tsc --noEmit`
// runs before any build step and would otherwise fail here.
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      // globals.css sets `scroll-behavior: smooth` globally. Next.js 16 no
      // longer auto-overrides that during route navigation (earlier
      // versions silently forced an instant jump-to-top on every
      // navigation to keep transitions snappy and conflict-free) — as of
      // 16, that coordination is opt-in via this attribute. Without it, a
      // navigation triggered while the previous one's CSS-animated smooth
      // scroll is still settling can leave the URL/rendered route out of
      // sync with what's on screen (see the fix/calculator-route-state-sync
      // branch history for the reported repro). See Next's own migration
      // notes: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        {/* Static, non-user-derived JSON built by buildOrganizationJsonLd — no HTML/script injection surface. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
