import { Analytics } from "@vercel/analytics/next";
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

// metadataBase lets relative image paths (like the auto-discovered
// opengraph-image.tsx) resolve to absolute URLs for the og: tags.
//
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL — explicit override (custom domain in prod,
//      or e.g. http://localhost:3000 if you want OG previews in dev)
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel auto-sets this on every
//      deployment and always points at the canonical production URL,
//      even from preview deploys. No setup required.
//   3. http://localhost:3000 — local dev fallback
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NewHere — Your 7/30/90-day plan for a new city",
  description:
    "A personalized 7/30/90-day plan to help you find communities, hobbies, and routines after moving to a new city.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "NewHere",
    title: "NewHere — Your first 90 days in any new city",
    description:
      "A personalized plan that adapts to your city, interests, and timeline — so you can find your community, anchor your routine, and feel at home.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewHere — Your first 90 days in any new city",
    description:
      "A personalized plan that adapts to your city, interests, and timeline — so you can find your community, anchor your routine, and feel at home.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
