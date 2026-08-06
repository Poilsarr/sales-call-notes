import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteFooter from "@/components/site-footer";
import { productJsonLd } from "@/lib/seo";
import { CommandMenu } from "@/components/ui/command-menu";
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
  metadataBase: new URL("https://usegauge.com"),
  title: {
    default: "Gauge — AI Sales Call Notes for SDRs",
    template: "%s · Gauge",
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
    title: "Gauge — AI Sales Call Notes for SDRs",
    description: "Upload your call recording. Get summary, action items, and CRM-ready notes in seconds. Built for the modern SDR.",
    siteName: "Gauge",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Gauge — Know the moment a competitor enters the deal.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gauge — AI Sales Call Notes for SDRs",
    description: "Upload your call recording. Get summary, action items, and CRM-ready notes in seconds. Built for the modern SDR.",
    images: ["/og.png"],
  },
  appleWebApp: { capable: true, title: "Gauge", statusBarStyle: "default" },
  alternates: {
    canonical: "https://usegauge.com",
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
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/27834908180db20f-s.p.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/78fec81b34c4a365-s.p.woff2"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productJsonLd() }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="noise-overlay" />
        <CommandMenu />
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignUpUrl="/app" afterSignInUrl="/app">
          {children}
          <SiteFooter />
          <Analytics />
          <SpeedInsights />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Defer service-worker registration until the browser is idle so
                // it never blocks LCP / Speed Index. requestIdleCallback isn't
                // available everywhere; fall back to a 2s timeout.
                (function() {
                  if (!('serviceWorker' in navigator)) return;
                  var reg = function() { navigator.serviceWorker.register('/sw.js').catch(function() {}); };
                  if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(reg, { timeout: 2000 });
                  } else {
                    window.addEventListener('load', function() { setTimeout(reg, 1500); });
                  }
                })();
              `,
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
