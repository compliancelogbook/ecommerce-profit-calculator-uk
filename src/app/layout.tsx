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

export const metadata: Metadata = {
  metadataBase: new URL("https://easyfeezy.com"),
  title: {
    template: "%s | EasyFeezy",
    default: "EasyFeezy — Marketplace Fee & Profit Calculator",
  },
  description: SITE_DESCRIPTION,
  keywords: "shopify fee calculator, ebay fee calculator, amazon fee calculator, etsy fee calculator, seller profit calculator, ecommerce margin calculator, shopify payments fees",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: SITE_NAME,
    title: "EasyFeezy — Marketplace Fee & Profit Calculator",
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyFeezy — Marketplace Fee & Profit Calculator",
    description: SITE_DESCRIPTION,
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
