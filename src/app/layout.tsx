import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { productJsonLd } from "@/lib/seo";
import "./globals.css";

const geistSans = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CallNote Pro — AI Sales Call Notes for SDRs",
    template: "%s · CallNote Pro",
  },
  description: "Upload your call recording. Get summary, action items, and CRM-ready notes in seconds. Built for the modern SDR.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-72.png", sizes: "72x72", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-384.png", sizes: "384x384", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "CallNote Pro — AI Sales Call Notes for SDRs",
    description: "Upload your call recording. Get summary, action items, and CRM-ready notes in seconds. Built for the modern SDR.",
    siteName: "CallNote Pro",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "CallNote Pro — Know the moment a competitor enters the deal.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CallNote Pro — AI Sales Call Notes for SDRs",
    description: "Upload your call recording. Get summary, action items, and CRM-ready notes in seconds. Built for the modern SDR.",
    images: ["/og.png"],
  },
  appleWebApp: { capable: true, title: "CallNote Pro", statusBarStyle: "default" },
  alternates: {
    canonical: "https://callnotepro.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productJsonLd() }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}>
        <div className="noise-overlay" />
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignUpUrl="/app" afterSignInUrl="/app">
          {children}
          <footer className="border-t border-gray-200 py-6 px-6 text-center">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-gray-400">
              <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Notice</Link>
              <Link href="/refund" className="hover:text-gray-700 transition-colors">Refund Policy</Link>
            </div>
          </footer>
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
