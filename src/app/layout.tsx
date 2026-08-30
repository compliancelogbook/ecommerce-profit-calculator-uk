import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "../components/site/SiteHeader";
import SiteFooter from "../components/site/SiteFooter";
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
  "Marketplace fees made easy. Know what you'll actually make before you sell — accurate Shopify, Etsy, eBay and Amazon UK seller fee and profit calculators.";

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
  keywords: "shopify fee calculator, ebay fee calculator, amazon fee calculator, etsy fee calculator, seller profit calculator, ecommerce margin calculator, shopify payments fees",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
