import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CallNote Pro — Sales Call Notes, Instant",
  description: "Turn sales call recordings into actionable notes in seconds. Free for SDRs.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icon192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "CallNote Pro — Sales Call Notes, Instant",
    description: "Turn sales call recordings into actionable notes in seconds. Free for SDRs.",
    siteName: "CallNote Pro",
    type: "website",
    locale: "en_US",
  },
  appleWebApp: { capable: true, title: "CallNote Pro", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-[#050505] text-[#fafafa]`}>
        <div className="noise-overlay" />
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          {children}
          <footer className="border-t border-white/5 py-6 px-6 text-center">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-white/25">
              <Link href="/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy Notice</Link>
              <Link href="/refund" className="hover:text-white/50 transition-colors">Refund Policy</Link>
            </div>
          </footer>
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
