import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shopify & eBay Fees Calculator | Free Seller Profit Calculator",
  description: "Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, and Amazon. Constantly updated with the latest 2026 fee changes.",
  keywords: "shopify fee calculator, ebay fee calculator, amazon fee calculator, seller profit calculator, ecommerce margin calculator, shopify payments fees",
  openGraph: {
    title: "Shopify & eBay Fees Calculator | Free Seller Profit Calculator",
    description: "Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, and Amazon.",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify & eBay Fees Calculator | Free Seller Profit Calculator",
    description: "Accurately calculate your seller fees, margins, and net profit for Shopify, eBay, Etsy, and Amazon.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
